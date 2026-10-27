<script lang="ts">
  import EntryList from "#lib/components/EntryList.svelte";
  import Footer from "#lib/components/Footer.svelte";
  import HCard from "#lib/components/HCard.svelte";
  import Head from "#lib/components/Head.svelte";
  import Section from "#lib/components/Section.svelte";
  import Sidebar from "#lib/components/Sidebar.svelte";
  import { author } from "#lib/data/author.ts";
  import { strings } from "#lib/data/site.ts";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
  const resume = $derived(data.resume);

  // The avatar and the actions in the sidebar change once the page has been scrolled a little.
  const SCROLLED_AFTER = 200;
  let scrollY = $state(0);
  const scrolled = $derived(scrollY > SCROLLED_AFTER);
</script>

<svelte:window bind:scrollY />

<Head />

<!--
  Print turns the page into one A4 sheet: the h-card beside the introduction, then the work, the
  apps, and skills, languages and education in three columns.
-->
<div
  class="group relative min-h-screen lg:grid lg:grid-cols-[25%_1fr] lg:grid-rows-[auto_1fr_auto] print:grid print:min-h-0 print:grid-cols-[45%_1fr] print:gap-8"
  data-scrolled={scrolled ? "" : undefined}
>
  <header class="pt-8 lg:col-start-2 lg:row-start-1 print:p-0">
    <div class="gutter">
      <HCard />
    </div>
  </header>

  <!-- The résumé itself (https://microformats.org/wiki/h-resume); the person is the h-card above. -->
  <main class="h-resume lg:col-start-2 lg:row-start-2 print:contents">
    <div class="gutter print:contents">
      <Section id="section-introduction" title={resume.introduction.title} class="print:self-start print:py-0">
        <div class="lead p-summary e-content markdown max-w-[60ch] text-xl leading-normal font-light md:text-2xl print:text-base">
          <!-- The Markdown comes from src/content, which the site owner writes. -->
          {@html resume.introduction.html}
        </div>
      </Section>

      <Section id="section-experience" title={strings.titles.experience} class="print:col-span-2 print:break-inside-auto">
        <EntryList entries={resume.entries.work} property="p-experience" />
      </Section>

      <Section id="section-apps" title={strings.titles.apps} class="print:col-span-2">
        <EntryList entries={resume.entries.apps} property="p-apps" />
      </Section>

      <div class="grid grid-cols-2 gap-x-16 break-inside-avoid print:col-span-2 print:grid-cols-3 print:gap-5">
        <Section id="section-skills" title={strings.titles.skills} class="col-span-2 md:col-span-1 print:col-span-1 print:py-0">
          <ul class="bulletlist print:pl-3">
            {#each author.skills as skill (skill)}
              <li class="p-skill print:mb-px print:text-[0.8rem] print:leading-tight">{skill}</li>
            {/each}
          </ul>
        </Section>

        <Section id="section-languages" title={strings.titles.languages} class="col-span-2 md:col-span-1 print:col-span-1 print:py-0">
          <ul class="bulletlist print:pl-3">
            {#each author.languages as language (language.name)}
              <li class="p-skill print:mb-px print:text-[0.8rem] print:leading-tight">
                {language.name} ({language.level})
              </li>
            {/each}
          </ul>
        </Section>

        <Section id="section-education" title={strings.titles.education} class="col-span-2 md:col-span-1 print:col-span-1 print:py-0">
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
  <Footer />
</div>
