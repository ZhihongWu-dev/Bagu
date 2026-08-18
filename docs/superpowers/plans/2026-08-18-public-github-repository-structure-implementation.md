# Bagu Public GitHub Repository Structure Implementation Plan

## Goal

Publish the complete current Bagu project to `ZhihongWu-dev/Bagu` through a
reviewable Draft PR without rewriting the remote history or exposing secrets,
generated files, personal annotations, or restricted source material.

The product boundary is defined by
`docs/superpowers/specs/2026-08-18-public-github-repository-structure-design.md`.

## GitHub Research

The implementation uses these official references:

- [`actions/checkout`](https://github.com/actions/checkout): MIT, latest release
  `v7.0.1` on 2026-07-20, actively maintained. Use the official checkout action
  rather than scripting repository acquisition.
- [`actions/setup-node`](https://github.com/actions/setup-node): MIT, latest
  release `v7.0.0` on 2026-07-14, actively maintained. Use its npm cache support
  with `app/package-lock.json`.
- [`expo/expo`](https://github.com/expo/expo): MIT and actively maintained on
  2026-08-18. Follow the Expo project's Node and package-manager expectations;
  do not copy repository code or assets.

The workflow uses Node 22 because that is the LTS line currently used to verify
this checkout. External code is not copied.

## Phase 1: Capture And Classify The Worktree

1. Record the current branch, HEAD, remote branches, staged changes, unstaged
   changes, ignored files, and untracked candidates.
2. Export explicit candidate lists for source, documentation, tests, quality
   metadata, and backend files.
3. Confirm that intentional documentation moves and deletions remain staged and
   that unrelated local runtime data remains ignored.
4. Inspect all candidate environment and configuration files before staging.

Exit criteria:

- every candidate file is classified as publish, ignore, or investigate;
- no existing change is reverted or silently omitted;
- the initial publication can be staged from explicit paths.

## Phase 2: Establish The Public Root

Create or revise:

```text
README.md
SECURITY.md
THIRD_PARTY_NOTICES.md
.github/workflows/ci.yml
.gitignore
```

Actions:

1. Write a concise root README with the app/backend layout, prerequisites,
   install, validation, Expo start, CloudBase status, copyright boundary, and
   contributor workflow.
2. Move the applicable Expo template notice from `app/LICENSE` into
   `THIRD_PARTY_NOTICES.md`; remove `app/LICENSE` so it cannot be mistaken for a
   Bagu license.
3. State explicitly that Bagu has no open-source license in this release.
4. Add security reporting and secret-handling guidance without publishing an
   unsupported response-time commitment.
5. Reconcile the local and remote `.gitignore`, preserving both useful sets of
   exclusions.

Exit criteria:

- a new contributor can identify and run the app from the root README;
- Bagu and third-party copyright terms are unambiguous;
- local collection and annotation output paths are ignored.

## Phase 3: Add Continuous Integration

Add `.github/workflows/ci.yml` with:

1. `actions/checkout@v7`;
2. `actions/setup-node@v7`, Node 22, npm caching based on
   `app/package-lock.json`;
3. `npm ci` in `app/`;
4. TypeScript, lint, content, question-quality, learning, analytics, role,
   application, resume, annotation, and intake checks that are already exposed
   by the repository;
5. no CloudBase credentials, production environment, write permission, or
   deployment step.

Keep the workflow readable and serial for the first publication. Optimization
and matrix expansion are out of scope.

Exit criteria:

- workflow syntax is valid;
- every invoked package script exists and succeeds locally or has a documented
  understood baseline;
- workflow permissions are read-only unless GitHub requires an implicit
  metadata permission.

## Phase 4: Security And Publication Audit

1. Scan publish candidates for common credential assignments, private keys,
   tokens, cookies, authorization headers, personal identifiers, and non-example
   environment files.
2. Inspect large files and binary assets; retain only product assets required by
   the app.
3. Confirm that manual Nowcoder annotation data and harvested page content are
   absent. Manifests may contain public source URLs and normalized metadata but
   not copied restricted question bodies.
4. Verify ignored files with `git check-ignore` and inspect the proposed tree
   from the index before committing.

Exit criteria:

- secret scan has no unexplained finding;
- no local annotation export, analytics export, credential, or generated output
  is staged;
- every large tracked file is intentional.

## Phase 5: Validate The Project

Run from `app/`:

```text
npx tsc --noEmit
npm run lint
npm run validate:content
npm run validate:questions
npm run validate:question-reviews
npm run validate:math
npm run validate:ui
npm run test:analytics
npm run test:question-quality
npm run test:learning
npm run test:roles
npm run test:resume
npm run test:application
npm run test:annotations
npm run test:annotation-tool
npm run test:intake
npx expo-doctor
```

Record legacy warnings separately from failures. Fix failures caused by the
publication changes; do not hide unrelated failures or upgrade dependencies as
part of repository packaging unless the workflow cannot run otherwise.

Exit criteria:

- all deterministic quality and test commands pass;
- any Expo Doctor patch drift is reported exactly;
- the CI command list matches the verified local commands.

## Phase 6: Build The Publication Branch

1. Create `agent/public-repo-structure` from the current local history.
2. Stage the reviewed publication scope with explicit path groups.
3. Inspect `git diff --cached --stat`, `git diff --cached --check`, and the full
   staged name-status list.
4. Commit the project publication with a terse scoped message.
5. Merge `origin/main` using `--allow-unrelated-histories`; resolve the remote
   initialization commit without force-pushing and without dropping either
   side's useful `.gitignore` rules.
6. Repeat the staged-tree security and file-list audit after the merge.

Exit criteria:

- branch contains both histories;
- no conflict marker remains;
- final committed tree matches the reviewed publication list.

## Phase 7: Push And Open A Draft PR

1. Push `agent/public-repo-structure` to `origin` with upstream tracking.
2. Open a Draft PR targeting `main` with a body that covers structure,
   copyright, security exclusions, tests, Expo Doctor baseline, and contributor
   impact.
3. Verify the PR head/base, changed files, checks, and public visibility.
4. Leave the PR unmerged for owner review.

Exit criteria:

- the branch is available to collaborators;
- the Draft PR targets `ZhihongWu-dev/Bagu:main`;
- the user receives the branch, commit, PR URL, validation results, and any
  residual risk.

## Rollback And Failure Rules

- Never force-push or reset the user's working tree.
- Authentication or permission failure stops before push.
- Suspicious files stop before commit until classified.
- Merge conflicts are resolved in place; user changes are not discarded.
- A failing but understood check may be documented in a Draft PR only if the
  branch is still useful for review. Unknown failures remain local.
