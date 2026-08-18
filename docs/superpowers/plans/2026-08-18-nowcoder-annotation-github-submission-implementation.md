# Nowcoder Annotation GitHub Submission Implementation Plan

## Goal

Let one collaborator complete the 59-source manual annotation batch, generate a
strictly sanitized tracked artifact, and submit it through a GitHub Pull Request.
The implementation follows
`docs/superpowers/specs/2026-08-18-nowcoder-annotation-github-submission-design.md`.

## GitHub Research

- [`HumanSignal/label-studio`](https://github.com/HumanSignal/label-studio):
  Apache-2.0, active on 2026-08-18, latest release 1.23.0. Its standardized
  structured export and separation between annotation UI and export format
  support using a dedicated submission boundary.
- [`doccano/doccano`](https://github.com/doccano/doccano): MIT, active in 2026,
  latest release v1.8.5. Its fixed-label export workflow supports retaining enum
  labels while excluding source prose and annotator session state.
- [`json-schema-org/JSON-Schema-Test-Suite`](https://github.com/json-schema-org/JSON-Schema-Test-Suite):
  MIT and active on 2026-08-16. Its positive and negative fixture style supports
  testing exact schemas and rejecting unknown fields.

Only workflow concepts are reused. No external source or asset is copied, and no
new runtime dependency is introduced.

## Phase 1: Submission Types And Pure Transformation

Add `app/scripts/nowcoder-annotation/submission.ts` with:

- public submission and record types;
- the canonical submission ID and path contract;
- a pure complete-dataset to public-submission transformation;
- a strict public-submission validator;
- deterministic JSON serialization.

Test first:

- a complete 59-source dataset transforms successfully;
- any pending or missing source fails with `submission_incomplete`;
- records follow manifest order;
- arrays follow taxonomy order;
- `summary`, `skipNote`, `updatedAt`, URLs, queries, review notes, and contributor
  identity never appear;
- repeated generation with the same `generatedAt` is byte-identical;
- unknown top-level and record fields fail;
- duplicate, missing, unknown, and pending records fail;
- page-type and annotation-state constraints are enforced.

Exit criteria:

- the pure module has no network, Git, browser, or process dependency;
- every serialized record contains only the design allowlist.

## Phase 2: Schema And Repository Validator

Add:

```text
app/quality/nowcoder-intake/schemas/annotation-submission.schema.json
app/scripts/validate-annotation-submission.ts
app/quality/nowcoder-intake/submissions/README.md
```

The CLI loads the current manifest, discovers JSON files in the submissions
directory, rejects any filename except `pilot-100-v1.json`, and validates the
canonical file when present. An empty directory is valid before the first
contribution; a malformed or additional JSON file fails.

Add `annotation:validate-submission` to `app/package.json` and invoke it from CI.

Test first:

- empty submissions directory passes;
- the canonical valid artifact passes;
- extra JSON, wrong filename, malformed JSON, and invalid content fail;
- schema enums and runtime enums stay synchronized.

Exit criteria:

- contributors can validate locally with one package command;
- CI uses the same runtime validation path as generation.

## Phase 3: Atomic Generation And Server Route

Extend the annotation server options with a default canonical output path:

```text
quality/nowcoder-intake/submissions/pilot-100-v1.json
```

Add `POST /api/submission`:

1. apply the existing host, origin, content type, and body-size checks;
2. load and validate the private dataset;
3. build and validate the complete public artifact;
4. write it atomically only after all checks pass;
5. return the repository-relative path and next commands.

The response must not expose an absolute filesystem path. A failed generation
must leave an existing artifact byte-for-byte unchanged.

Test first:

- incomplete data returns 400 and creates no file;
- invalid origin and content type remain rejected;
- complete data returns 201 and writes the exact validated artifact;
- a failing replacement preserves the old artifact;
- the original `/api/export` behavior remains unchanged.

Exit criteria:

- no Git command or GitHub credential is used by the server;
- private export and public submission paths remain separate.

## Phase 4: Annotation UI

Add a secondary **生成 GitHub 提交文件** button next to the existing private
export command. The button:

- remains disabled while a request runs;
- reports incomplete progress without changing the current annotation;
- displays the repository-relative file path and concise validation/Git steps;
- does not render server strings as HTML;
- remains usable at the existing mobile breakpoint.

Extend the jsdom test to cover incomplete and successful submission responses,
button state restoration, and text-only rendering.

Exit criteria:

- the existing annotation workflow is unchanged until the new button is used;
- no credential prompt, upload request, or external network request is added.

## Phase 5: Contributor Documentation

Update:

- `app/quality/nowcoder-intake/README.md` with the branch/fork/PR workflow;
- root `README.md` with a short link to the contributor procedure;
- the submissions README with exact review rules;
- `.gitignore` only if needed to keep private data ignored while allowing the
  canonical submissions directory.

Document that the collaborator must use their own Nowcoder account in a normal
browser and must never paste source prose into the tool. Repository write access
is optional because a public fork can open the same PR.

Exit criteria:

- a fresh contributor can complete the flow without private file transfer;
- documentation does not suggest `git add -f` or committing `manual-data`.

## Phase 6: Verification And Publication

Run:

```text
npx tsc --noEmit
npm run lint
npm run test:annotation-tool
npm run annotation:validate-submission
npm run validate:content
npm run validate:questions
npm run validate:question-reviews
npm run test:intake
npx expo-doctor
```

Also run a browser-sized jsdom smoke test through the annotation suite and
inspect the generated artifact for forbidden strings and fields.

Then:

1. audit the diff and secret scan;
2. commit the implementation on `agent/annotation-submissions`;
3. push the branch and create a Draft PR against `main`;
4. wait for GitHub Actions;
5. report the PR and residual baselines without auto-merging.

## Failure Rules

- Never track or force-add `manual-data`, raw exports, cookies, or page content.
- Never overwrite an accepted canonical file after a failed generation.
- Do not weaken the validator to accept a manually expanded submission.
- Do not auto-merge a submission or convert it into production questions.
- Keep known legacy question warnings and Expo patch drift visible rather than
  suppressing them.
