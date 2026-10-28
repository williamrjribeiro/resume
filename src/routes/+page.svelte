<script lang="ts">
  import EntryList from "#lib/components/EntryList.svelte";
  import Footer from "#lib/components/Footer.svelte";
  import HCard from "#lib/components/HCard.svelte";
  import Head from "#lib/components/Head.svelte";
  import Section from "#lib/components/Section.svelte";
  import Sidebar from "#lib/components/Sidebar.svelte";
  import { author } from "#lib/data/author.ts";
  import { strings } from "#lib/data/site.ts";
  import type { load } from "./+page.server.ts";

  let { data }: { data: ReturnType<typeof load> } = $props();
  const resume = $derived(data.resume);

  // The avatar and the actions in the sidebar change once the page has been scrolled a little.
  const SCROLLED_AFTER = 200;
  let scrollY = $state(0);
  const scrolled = $derived(scrollY > SCROLLED_AFTER);

  // Print runs the skills and the languages together as one line each, separated by dots.
  const printInline =
    "print:pl-0 print:whitespace-nowrap print:before:hidden print:not-last:after:px-1.5 print:not-last:after:text-secondary print:not-last:after:content-['·']";
</script>

<svelte:window bind:scrollY />

<Head />

<!--
  Print turns the page into at most two A4 sheets: the h-card as a letterhead, the introduction, the work
  and the apps, then skills and languages side by side above the education.
-->
<div
  class="group relative min-h-screen lg:grid lg:grid-cols-[25%_1fr] lg:grid-rows-[auto_1fr_auto] print:block print:min-h-0"
  data-scrolled={scrolled ? "" : undefined}
>
  <header
    class="pt-8 lg:col-start-2 lg:row-start-1 print:border-b-2 print:border-primary print:pt-0 print:pb-3"
  >
    <div class="gutter">
      <HCard />
    </div>
  </header>

  <!-- The résumé itself (https://microformats.org/wiki/h-resume); the person is the h-card above. -->
  <main class="h-resume lg:col-start-2 lg:row-start-2 print:contents">
    <div class="gutter print:contents">
      <Section id="section-introduction" title={resume.introduction.title} class="print:pt-3">
        <div
          class="lead p-summary e-content markdown max-w-[60ch] text-xl leading-normal font-light md:text-2xl print:max-w-none print:text-[1.05rem] print:leading-snug print:font-normal print:[&_i]:text-gray-dark"
        >
          <!-- The Markdown comes from src/content, which the site owner writes. -->
          {@html resume.introduction.html}
        </div>
      </Section>

      <Section
        id="section-experience"
        title={strings.titles.experience}
        class="print:break-inside-auto"
      >
        <EntryList entries={resume.entries.work} property="p-experience" />
      </Section>

      <Section id="section-apps" title={strings.titles.apps}>
        <EntryList entries={resume.entries.apps} property="p-apps" />
      </Section>

      <div
        class="grid break-inside-avoid grid-cols-2 gap-x-16 print:grid-cols-[3fr_2fr] print:gap-x-8"
      >
        <Section
          id="section-skills"
          title={strings.titles.skills}
          class="col-span-2 md:col-span-1 print:col-span-1"
        >
          <ul class="bulletlist print:flex print:flex-wrap print:pl-0">
            {#each author.skills as skill (skill)}
              <li class={["p-skill", printInline]}>{skill}</li>
            {/each}
          </ul>
        </Section>

        <Section
          id="section-languages"
          title={strings.titles.languages}
          class="col-span-2 md:col-span-1 print:col-span-1"
        >
          <ul class="bulletlist print:flex print:flex-wrap print:pl-0">
            {#each author.languages as language (language.name)}
              <li class={["p-skill", printInline]}>
                {language.name} ({language.level})
              </li>
            {/each}
          </ul>
        </Section>

        <Section
          id="section-education"
          title={strings.titles.education}
          class="col-span-2 md:col-span-1 print:col-span-2"
        >
          <EntryList entries={resume.entries.education} property="p-education" />
        </Section>
      </div>

      <Section id="section-volunteering" title={strings.titles.volunteering} class="print:hidden">
        <EntryList entries={resume.entries.volunteering} property="p-volunteering" />
      </Section>

      <Section id="section-gap-year" title={resume.gapYear.title} class="print:hidden">
        <div class="e-content markdown">
          {@html resume.gapYear.html}
        </div>
      </Section>
    </div>
  </main>

  <Sidebar />
  <Footer builtAt={data.builtAt} />
</div>
