# Bagu repository instructions

## Research before implementation

- Before implementing a new feature, screen, component, architecture change, or other non-trivial behavior, search GitHub for relevant open-source implementations and official Expo or React Native examples.
- Prefer actively maintained projects that match this repository's Expo SDK and React Native stack. Review the source, open issues, and license before adopting a pattern.
- Briefly report the most useful references and what will be reused conceptually before implementation begins.
- Treat external projects as references, not as a second source of truth. Do not copy code or assets unless the license permits it and any attribution requirements are satisfied.
- Skip this research only for trivial fixes such as typos, formatting, or an obvious one-line correction.

## Skill ownership

- Use the Expo plugin as the primary implementation authority for Expo and React Native work, selecting the most specific Expo skill for the current subtask.
- Use brainstorming only for product and interaction decisions, browser or computer-use only for verification, image generation only for bitmap assets, and GitHub tooling only for repository operations.
- Avoid applying multiple overlapping implementation skills to the same code change. When guidance conflicts, project requirements and the most specific Expo skill win.

## Product and verification

- Optimize the mobile experience for iPhone first while preserving Expo Go compatibility unless a requirement explicitly needs a development build.
- Keep the main learning flow immediate, visual, and low in text. Prefer progressive disclosure for explanations.
- Make reasonable, reversible assumptions and continue without interrupting the user unless a decision is destructive, externally consequential, or materially changes product scope.
- Verify non-trivial changes with TypeScript, lint, Expo Doctor, relevant exports, and an interactive mobile-sized smoke test when available.

## GitHub publication workflow

- Treat the repository owner's standalone request `push` as a request to inspect the current task's diff, run relevant checks, commit only the reviewed scope, push an `agent/<description>` branch, and create or update a Draft PR targeting `main`.
- Before staging, inspect tracked, untracked, and ignored files for secrets, personal data, generated output, and unrelated user changes. Never interpret `push` as permission to run an unreviewed `git add .` or `git add -A` in a mixed worktree.
- Never force-push, merge into `main`, bypass failing checks, or publish ambiguous files solely because the user said `push`. Report the blocker or leave the change in a Draft PR.
