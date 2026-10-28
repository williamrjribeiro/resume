/**
 * Local HTTPS certificates for serving production builds on this machine and on
 * the LAN (a phone installing a PWA needs HTTPS).
 *
 *   bun run certs            create the certificate in .certs/ (or reuse it)
 *   bun run certs:clean      delete .certs/
 *
 * `mkcert` is used when installed: its local CA can be trusted by this machine and
 * by iOS/iPadOS. Otherwise `openssl` makes a self-signed certificate that browsers
 * and phones warn about. The certificate names `localhost`, this host and its
 * current LAN addresses, so it is made again when those change.
 *
 * .certs/ is git-ignored. The private key is a secret: never commit it.
 * Only Arch Linux is supported for now (`pacman`, `iproute2`); nothing here is
 * special-cased for other operating systems.
 */

export type CertTool = "mkcert" | "openssl";

export type CertMeta = {
  readonly tool: CertTool;
  readonly sans: ReadonlyArray<string>;
};

export type Certificate = {
  readonly tool: CertTool;
  readonly certFile: string;
  readonly keyFile: string;
  readonly sans: ReadonlyArray<string>;
  /** The mkcert root certificate to install on other devices. */
  readonly caRoot?: string;
};

export type EnsureCertsOptions = {
  readonly certDir?: string;
};

const ROOT = Bun.fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");

export const CERT_DIR = `${ROOT}/.certs`;

type CommandResult = { readonly code: number; readonly stdout: string; readonly stderr: string };

const run = async (command: ReadonlyArray<string>): Promise<CommandResult> => {
  const proc = Bun.spawn([...command], { stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  return { code: await proc.exited, stdout, stderr };
};

const output = async (command: ReadonlyArray<string>): Promise<string> => {
  const result = await run(command).catch(() => undefined);
  return result !== undefined && result.code === 0 ? result.stdout : "";
};

export const isIPv4 = (value: string): boolean => /^\d{1,3}(?:\.\d{1,3}){3}$/.test(value);

export const isIP = (value: string): boolean => isIPv4(value) || value.includes(":");

/** The IPv4 addresses this machine has on the local network (`iproute2`). */
export const lanAddresses = async (): Promise<ReadonlyArray<string>> => {
  const text = await output(["ip", "-4", "-o", "addr", "show", "scope", "global"]);
  const fromIp = [...text.matchAll(/\binet (\d{1,3}(?:\.\d{1,3}){3})\//g)]
    .map((match) => match[1])
    .filter((address): address is string => address !== undefined && address !== "127.0.0.1");
  if (fromIp.length > 0) return fromIp;

  const fallback = await output(["hostname", "-I"]);
  return fallback.split(/\s+/).filter((address) => isIPv4(address) && address !== "127.0.0.1");
};

/** `host` and `host.local`, the names mDNS answers for this machine. */
export const localNames = async (): Promise<ReadonlyArray<string>> => {
  const hostname = (await output(["hostname"])).trim().split(".")[0];
  if (hostname === undefined || hostname === "" || hostname === "localhost") return [];
  return [hostname, `${hostname}.local`];
};

/** The subject alternative names of the certificate, without duplicates, sorted. */
export const certificateSans = (
  addresses: ReadonlyArray<string>,
  names: ReadonlyArray<string>,
): ReadonlyArray<string> =>
  [...new Set(["localhost", "127.0.0.1", "::1", ...names, ...addresses])].sort();

export const sameSans = (left: ReadonlyArray<string>, right: ReadonlyArray<string>): boolean =>
  JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());

/** The `openssl req -config` file for a self-signed certificate that names `sans`. */
export const opensslConfig = (sans: ReadonlyArray<string>): string => {
  const names = sans.filter((value) => !isIP(value));
  const addresses = sans.filter(isIP);
  const altNames = [
    ...names.map((value, index) => `DNS.${index + 1} = ${value}`),
    ...addresses.map((value, index) => `IP.${index + 1} = ${value}`),
  ];
  return `[req]
prompt = no
distinguished_name = dn
x509_extensions = v3_req

[dn]
CN = bun-agentic-starter local

[v3_req]
subjectAltName = @alt_names
basicConstraints = critical, CA:TRUE
keyUsage = critical, digitalSignature, keyEncipherment, keyCertSign
extendedKeyUsage = serverAuth

[alt_names]
${altNames.join("\n")}
`;
};

const readMeta = async (metaFile: string): Promise<CertMeta | undefined> => {
  try {
    const value: unknown = await Bun.file(metaFile).json();
    if (typeof value !== "object" || value === null) return undefined;
    const { tool, sans } = value as { tool?: unknown; sans?: unknown };
    if (tool !== "mkcert" && tool !== "openssl") return undefined;
    if (!Array.isArray(sans) || !sans.every((item) => typeof item === "string")) return undefined;
    return { tool, sans };
  } catch {
    return undefined;
  }
};

const mkcertRoot = async (mkcert: string): Promise<string | undefined> => {
  const root = (await output([mkcert, "-CAROOT"])).trim();
  return root === "" ? undefined : `${root}/rootCA.pem`;
};

/** Creates the certificate and key in `certDir`, or reuses them while the names still match. */
export const ensureCerts = async (options: EnsureCertsOptions = {}): Promise<Certificate> => {
  const certDir = options.certDir ?? CERT_DIR;
  const certFile = `${certDir}/localhost.pem`;
  const keyFile = `${certDir}/localhost-key.pem`;
  const metaFile = `${certDir}/sans.json`;
  const opensslConfigFile = `${certDir}/openssl.cnf`;

  const [addresses, names] = await Promise.all([lanAddresses(), localNames()]);
  const sans = certificateSans(addresses, names);
  const meta = await readMeta(metaFile);
  const filesExist = (await Bun.file(certFile).exists()) && (await Bun.file(keyFile).exists());
  const mkcert = Bun.which("mkcert");

  const withRoot = async (tool: CertTool): Promise<Certificate> => {
    const caRoot = mkcert === null || tool !== "mkcert" ? undefined : await mkcertRoot(mkcert);
    return caRoot === undefined
      ? { tool, certFile, keyFile, sans }
      : { tool, certFile, keyFile, sans, caRoot };
  };

  if (filesExist && meta !== undefined && sameSans(meta.sans, sans)) {
    return withRoot(meta.tool);
  }

  await run(["mkdir", "-p", certDir]);

  if (mkcert !== null) {
    const installed = await run([mkcert, "-install"]);
    if (installed.code !== 0) {
      console.warn(
        "mkcert -install failed; the certificate is made but may not be trusted. Run `mkcert -install` once in a terminal:",
      );
      if (installed.stderr.trim() !== "") console.warn(installed.stderr.trim());
    }
    const generated = await run([mkcert, "-cert-file", certFile, "-key-file", keyFile, ...sans]);
    if (generated.code !== 0) {
      throw new Error(`mkcert failed:\n${generated.stderr || generated.stdout}`);
    }
    await Bun.write(metaFile, `${JSON.stringify({ tool: "mkcert", sans }, null, 2)}\n`);
    return withRoot("mkcert");
  }

  const openssl = Bun.which("openssl");
  if (openssl === null) {
    throw new Error(
      "Neither mkcert nor openssl is installed. Install openssl (sudo pacman -S openssl) or mkcert (sudo pacman -S mkcert nss) and run again.",
    );
  }
  await Bun.write(opensslConfigFile, opensslConfig(sans));
  const generated = await run([
    openssl,
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-sha256",
    "-days",
    "825",
    "-nodes",
    "-keyout",
    keyFile,
    "-out",
    certFile,
    "-config",
    opensslConfigFile,
  ]);
  if (generated.code !== 0) {
    throw new Error(`openssl failed:\n${generated.stderr || generated.stdout}`);
  }
  await run(["chmod", "600", keyFile]);
  await Bun.write(metaFile, `${JSON.stringify({ tool: "openssl", sans }, null, 2)}\n`);
  return withRoot("openssl");
};

/** What to tell the user about trusting the certificate. */
export const trustHelp = (certificate: Certificate): ReadonlyArray<string> => {
  if (certificate.tool === "mkcert") {
    return [
      "Certificate: mkcert local CA (trusted on this machine).",
      ...(certificate.caRoot === undefined
        ? []
        : [
            `iPhone/iPad: install ${certificate.caRoot} once, then enable it under Settings → General → About → Certificate Trust Settings.`,
          ]),
    ];
  }
  return [
    "Certificate: self-signed (not trusted). Browsers and phones will warn.",
    "For a trusted local certificate: sudo pacman -S mkcert nss && mkcert -install, then run `bun run certs:clean` and start again.",
    `Or install ${certificate.certFile} on the device and enable full trust. Share the certificate, never the key.`,
  ];
};

if (import.meta.main) {
  const certificate = await ensureCerts();
  console.log(`Certificate: ${certificate.certFile}`);
  console.log(`Key:         ${certificate.keyFile} (secret, git-ignored)`);
  console.log(`Names:       ${certificate.sans.join(", ")}`);
  console.log("");
  for (const line of trustHelp(certificate)) console.log(line);
}
