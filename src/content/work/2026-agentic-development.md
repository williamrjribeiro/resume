---
title: Agentic Software Development
organization: Independent projects
organizationUrl: https://github.com/williamrjribeiro
location: Lisbon, PT
start: 2026-05-01
---

<b>Learning by building:</b> AI tools and techniques change from one month to the next, so I test them on real software instead of only reading about them. I use Claude Code and Cursor, including Cursor's cloud agents, and I compare planning modes, prompting styles and spec-driven frameworks such as GSD. I keep what works, drop what doesn't, and write down why.

<b>Evaluating AI agents:</b> Built Verdant, a private Tessl workspace with two skill packages that teach agents when to use Git worktrees and when to use stacked pull requests. It has nine levelled eval scenarios with weighted rubrics, blocking failures and adversarial cases, run against a pinned, Bash-validated fixture repository. Planned with GSD in 5 phases, 21 plans and 56 tasks, and backed by contract tests, path-scoped CI and a verified publish dry-run.

<b>Parallel agents, human review:</b> Directed background agents in parallel git worktrees to build a 19-story redesign of a guitar-lesson player (SolidJS, Bun, Storybook), sending the hardest stories to a stronger model and the rest to a faster one. I reviewed and merged the work as one pull request. The project reached 290 tracked issues and 199 commits in under four weeks.

<b>Specs and quality gates:</b> Every feature starts from a written spec and user stories tracked in Beads, an issue tracker built for agents. Agents work behind a pre-commit hook that mirrors CI, behavior-driven tests, Storybook and screenshot-based visual checks. Hexkit, my contract-driven API generator, was also spec-first: an RFC and a PRD before code, then a 90% coverage gate.

<b>Improving the process:</b> I change my workflow when the results say so. I moved from stacked pull requests to one epic branch after review overhead and token costs piled up, replaced manual visual checks with screenshot comparison, and turned a long `AGENTS.md` into reusable skills. I packaged the lessons as eight repository skills and an open-source starter template, [bun-agentic-starter](https://github.com/williamrjribeiro/bun-agentic-starter).
