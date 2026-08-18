# Bagu Public GitHub Repository Structure Design

**Date:** 2026-08-18  
**Status:** Approved design pending written-spec review

## Objective

Publish the current Bagu project to the public repository
`ZhihongWu-dev/Bagu` in a structure that another contributor or coding agent can
clone, understand, test, and continue. Preserve the existing local work, avoid
publishing generated or personal data, and make future `push` requests a
predictable reviewed workflow.

## Repository Layout

The repository remains a small monorepo:

```text
Bagu/
|-- app/                 # Expo and React Native client, tests, quality tooling
|-- cloudbase/           # CloudBase functions and backend configuration
|-- docs/                # Active specs, implementation plans, and archive
|-- .github/workflows/   # Continuous integration
|-- .gitignore
|-- README.md
|-- SECURITY.md
`-- THIRD_PARTY_NOTICES.md
```

This layout keeps the deployable client and backend independent while retaining
their shared product documentation in one history. No additional workspace or
monorepo framework is introduced.

## Publication Scope

The first publication includes the current product source, tests, scripts,
quality schemas and non-personal review fixtures, CloudBase source, and project
documentation. Existing intentional documentation moves and deletions are kept.

The publication excludes:

- dependencies, build products, Expo state, logs, temporary QR images, and
  local tool state;
- `.env` files, credentials, tokens, authentication artifacts, and machine
  configuration;
- manually collected Nowcoder content, annotation exports, reviewer working
  data, and other material that may contain copied text or personal data;
- runtime analytics exports and user data.

Only example environment files with empty or demonstrably non-secret values may
be committed. A secret and oversized-file scan runs before staging.

## Copyright And Third-Party Material

Bagu will not receive an open-source license in this release. The public source
is visible for collaboration, but no permission to copy, redistribute, or use
it commercially is granted beyond rights provided by law.

The Expo template license currently stored at `app/LICENSE` must not be
presented as the license for Bagu. Its applicable notice is retained in
`THIRD_PARTY_NOTICES.md`, together with notices required by dependencies or
adapted assets. Source-derived interview signals may influence original Bagu
questions, but copied Nowcoder question text is not published.

## Root Documentation

`README.md` provides:

- the product purpose and current development status;
- the `app/` and `cloudbase/` directory map;
- local prerequisites and verified install, test, and Expo start commands;
- the boundary between source-derived signals and original question content;
- the copyright status and a link to `THIRD_PARTY_NOTICES.md`;
- the contributor workflow, including the meaning of `push`.

`SECURITY.md` tells contributors not to commit secrets or user data and gives a
private reporting route without inventing an unsupported service-level promise.

## Git And GitHub Strategy

The local project and the remote `main` branch began with unrelated histories.
The first publication therefore uses a new branch named
`agent/public-repo-structure`, merges the remote initialization commit without
force-pushing, resolves the root `.gitignore` intentionally, and opens a Draft
PR targeting `main`.

The initial commit is staged from an explicit reviewed file list. Existing
mixed worktree changes are never collected with an unreviewed `git add .` or
`git add -A`.

## Future `push` Contract

When the repository owner says `push`, the coding agent performs this workflow:

1. Inspect the branch, status, diff, untracked files, and remote state.
2. Identify the current task's files and exclude unrelated or sensitive data.
3. Run the relevant tests plus repository-wide checks when the change has broad
   impact.
4. Create or reuse an `agent/<description>` branch, commit the reviewed scope,
   and push it to `origin`.
5. Create or update a Draft PR against `main`, reporting tests and residual
   risks.

`push` does not mean force-push, bypass tests, stage every local file blindly,
or merge automatically. A clean, explicitly approved change may later be marked
ready or merged; a failing or ambiguous change remains a Draft PR.

## Continuous Integration

The first GitHub Actions workflow uses the Node version supported by the Expo
project, installs dependencies from `app/package-lock.json`, and runs the
existing high-signal checks exposed by `app/package.json`. CI must not require
CloudBase credentials or production environment variables. Expo Doctor findings
caused only by known patch-version drift are documented rather than hidden.

## Verification

Before opening the Draft PR:

- verify `git status` and the staged diff file by file;
- scan tracked candidates for secret patterns and unexpectedly large files;
- run TypeScript, lint, content validation, question-quality tests, annotation
  tests, and other repository scripts applicable to the staged change;
- validate GitHub Actions YAML and inspect the final tree from the commit;
- confirm ignored local annotation and environment data are absent;
- push the branch and confirm that the Draft PR targets `main`.

## Failure Handling

Authentication, merge conflicts, test failures, or suspicious files stop the
publication before push. Conflicts are resolved without discarding local work.
Failed checks are recorded in the Draft PR only when the failure is understood
and publication of the branch remains useful; otherwise the branch stays local.

## Acceptance Criteria

- A fresh clone has an understandable root and reproducible app setup.
- All intended current source and documentation are present.
- No credential, personal annotation data, generated output, or copied
  restricted question corpus is tracked.
- Bagu's copyright status cannot be confused with the Expo template notice.
- CI exercises the project's existing quality gates.
- The first change is reviewable in a Draft PR and does not rewrite remote
  history.
- Future `push` requests follow the documented reviewed workflow.
