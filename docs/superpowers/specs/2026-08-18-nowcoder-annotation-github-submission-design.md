# Nowcoder Annotation GitHub Submission Design

**Date:** 2026-08-18  
**Status:** Approved design pending written-spec review

## Objective

Allow one external annotator to complete the current 59-source Nowcoder signal
batch and submit the result directly to Bagu through a GitHub Pull Request. The
submission must be safe for a public repository and must not require sending a
private archive to the repository owner.

## Scope

This iteration supports one complete annotation submission for manifest version
1. It does not implement multiple-annotator assignment, adjudication, automatic
merging, reviewer scoring, or direct import into the production question bank.

The annotator may have repository write access or may work from a public fork.
The annotation tool does not receive GitHub credentials and does not run Git
commands on the annotator's behalf.

## Submission Artifact

The annotation tool generates one canonical tracked file:

```text
app/quality/nowcoder-intake/submissions/pilot-100-v1.json
```

The artifact contains:

```text
schemaVersion
manifestVersion
submissionId
generatedAt
records[]
```

Each record contains only the fields applicable to its state:

- `sourceId`;
- `status`, restricted to `completed` or `skipped`;
- `relevance`;
- `role` and `recruitingStage`;
- `topicIds`, `followUpTypes`, and `misconceptionTypes`;
- choice-only `cognitiveLevel`, `distractorTypes`, and `answerCueTypes`;
- structured `skipReason`.

The artifact never contains:

- source URLs, search queries, page titles, or approval notes;
- source prose, question stems, choices, answers, or explanations;
- `summary`, `skipNote`, or any other free-text field;
- annotator name, email, account identifier, or device identifier;
- cookies, login state, credentials, resumes, contact details, or analytics.

Git commit authorship supplies the contribution audit trail, so the JSON does
not duplicate contributor identity.

## Completeness And Determinism

The GitHub artifact can be generated only when every source in the current
manifest is either `completed` or `skipped`. Pending sources cause a clear
`submission_incomplete` error and no tracked output is replaced.

Generation applies the existing annotation validator, strips all non-public
fields through an explicit allowlist, sorts records by manifest order, and
normalizes enum arrays through taxonomy order. The same completed dataset always
produces the same record content; only `generatedAt` changes.

The canonical filename is fixed for manifest version 1. A later accepted
revision updates the same file through a new PR instead of creating timestamped
duplicates.

## Local Interface

The existing private export remains available under ignored `manual-data/` for
the annotator's own backup. A second UI command, **生成 GitHub 提交文件**, creates
the sanitized canonical artifact.

On success, the interface displays:

- the generated repository-relative path;
- the validation command;
- concise branch, add, commit, push, and PR instructions.

The interface never invokes Git, reads `.git`, asks for a GitHub token, or sends
data over the network.

## Validation Boundary

Add a repository command:

```text
npm run annotation:validate-submission
```

The validator fails closed when:

- the top-level or record schema contains an unknown field;
- versions or the fixed submission ID do not match the current manifest;
- a manifest source is missing, duplicated, or unknown;
- a record is pending or violates the existing state rules;
- interview and multiple-choice fields are mixed incorrectly;
- enum values or array order are invalid;
- any string outside the fixed IDs, enums, and ISO timestamp appears;
- the canonical file is malformed or a second submission JSON is added.

The validator is added to GitHub Actions. A Pull Request cannot pass CI with an
unsafe or incomplete submission.

## Contributor Workflow

The annotator performs:

```text
git clone https://github.com/ZhihongWu-dev/Bagu.git
cd Bagu
git switch -c annotation/pilot-100-v1
cd app
npm ci
npm run annotation:start
```

After all 59 sources are processed, the annotator selects **生成 GitHub
提交文件**, then runs:

```text
npm run annotation:validate-submission
cd ..
git add app/quality/nowcoder-intake/submissions/pilot-100-v1.json
git commit -m "data: submit pilot annotation signals"
git push -u origin annotation/pilot-100-v1
```

With repository write access, the annotator opens a PR from that branch. Without
write access, the annotator pushes the same branch to a fork and opens a PR to
`ZhihongWu-dev/Bagu:main`.

The repository owner reviews the structured diff and CI result before merging.
The submission remains research evidence and is not automatically converted to
questions or app content.

## Tests

Automated tests cover:

- a complete dataset producing the expected allowlisted artifact;
- rejection while any of the 59 sources is pending;
- removal of `summary`, `skipNote`, URLs, queries, notes, and timestamps from
  individual annotation records;
- stable manifest order and taxonomy array order;
- rejection of unknown, duplicate, missing, pending, or wrong-page-type records;
- rejection of free text and extra submission files;
- route behavior that preserves an existing valid artifact when generation
  fails;
- the existing private export continuing unchanged;
- CI invoking the submission validator.

## Failure Handling

The artifact is written atomically only after the entire dataset validates and
sanitizes successfully. A failed generation does not create a partial file or
overwrite the previous accepted submission. File-system errors are reported in
the local UI without exposing an absolute path to GitHub.

Git authentication and Pull Request failures remain ordinary GitHub workflow
concerns; the local annotation server does not expand its loopback-only security
boundary.

## Acceptance Criteria

- A fresh clone from `main` can run the annotation tool and process all 59
  sources.
- A completed batch produces exactly one reviewable tracked JSON file.
- The file contains only structured, allowlisted non-expressive signals.
- The collaborator can submit it through a branch or fork without privately
  transferring an archive.
- CI rejects incomplete, malformed, manually expanded, or privacy-unsafe files.
- Private local annotations and exports remain ignored by Git.
- No submission is imported automatically into the production question bank.
