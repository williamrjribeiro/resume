/**
 * Clones the reference repositories listed in repos.json into repos/<name>,
 * shallow and pinned to a tag, so coding agents can read library source
 * locally. repos/ is git-ignored: nothing here is committed.
 *
 * Runs as the root postinstall. It never fails the install: offline or broken
 * clones are reported and skipped. Set SKIP_VENDORED_REPOS=1 (or CI=true) to
 * skip it entirely.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { $, Glob } from "bun";

interface RepoSpec {
  readonly url: string;
  readonly ref: string;
}

const root = join(import.meta.dir, "..");
const readJson = (file: string) => JSON.parse(readFileSync(join(root, file), "utf8"));

const rootPackage = readJson("package.json");
const manifest: Record<string, RepoSpec | string> = readJson("repos.json");

/** The version of `name` pinned in the root catalog, or else exactly in a workspace's package.json. */
const pinnedVersion = (name: string): string => {
  const catalogVersion: string | undefined = rootPackage.workspaces?.catalog?.[name];
  if (catalogVersion !== undefined) return catalogVersion;
  for (const pattern of rootPackage.workspaces?.packages ?? []) {
    for (const file of new Glob(`${pattern}/package.json`).scanSync(root)) {
      const { dependencies = {}, devDependencies = {} } = readJson(file);
      const version: string | undefined = dependencies[name] ?? devDependencies[name];
      if (version !== undefined && /^\d+\.\d+\.\d+/.test(version)) return version;
    }
  }
  throw new Error(`${name} is not pinned in the catalog or exactly in a workspace`);
};

/** Expands `{version:<pkg>}` to the version of `<pkg>` the workspace installs. */
const expandRef = (ref: string): string =>
  ref.replaceAll(/\{version:([^}]+)\}/g, (_, name: string) => pinnedVersion(name));

/** Clones `spec` into repos/<name>, or moves an existing clone to the pinned ref. */
const vendor = async (name: string, spec: RepoSpec): Promise<void> => {
  let ref: string;
  try {
    ref = expandRef(spec.ref);
  } catch (cause) {
    console.warn(`Could not vendor ${name}: ${String(cause)}`);
    return;
  }
  const dir = join(root, "repos", name);
  const marker = join(root, "repos", `.${name}.ref`);

  if (existsSync(dir) && !existsSync(join(dir, ".git"))) {
    console.warn(`repos/${name} exists but is not a git clone; delete it and reinstall.`);
    return;
  }
  if (existsSync(marker) && readFileSync(marker, "utf8").trim() === ref) return;

  const result = existsSync(dir)
    ? await $`git -C ${dir} fetch --depth 1 --no-tags origin tag ${ref} && git -C ${dir} -c advice.detachedHead=false checkout --quiet ${`refs/tags/${ref}`}`
        .quiet()
        .nothrow()
    : await $`git -c advice.detachedHead=false clone --quiet --depth 1 --single-branch --branch ${ref} ${spec.url} ${dir}`
        .quiet()
        .nothrow();

  if (result.exitCode !== 0) {
    console.warn(`Could not vendor ${name}@${ref}: ${result.stderr.toString().trim()}`);
    return;
  }
  writeFileSync(marker, `${ref}\n`);
  console.log(`Vendored ${spec.url} at ${ref} into repos/${name}`);
};

if (process.env.SKIP_VENDORED_REPOS === "1" || process.env.CI === "true") {
  console.log("Skipping vendored reference repositories.");
} else {
  await Promise.all(
    Object.entries(manifest).flatMap(([name, spec]) =>
      typeof spec === "string" ? [] : [vendor(name, spec)],
    ),
  );
}
