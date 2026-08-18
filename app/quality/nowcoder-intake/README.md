# Nowcoder public-signal intake

This is an offline-first research tool for deriving topic-level signals from a small, manually approved set of public Nowcoder pages. It is not a question scraper. It must not store source prose, question stems, options, answers, author identity, resumes, contact details, cookies, or login state.

## Boundaries

- Only `https://www.nowcoder.com` public URLs are accepted.
- Search results may supply candidate URLs, but every URL begins as `discovered` and requires human approval.
- The network runner fails closed when `robots.txt` cannot be fetched or parsed, and honors disallow rules and crawl delay.
- Requests are serial and delayed by 8-12 seconds or the stricter robots delay.
- Login, CAPTCHA, paid, unsupported, and low-signal pages are rejected. No bypass is attempted.
- HTML and extracted text exist only in memory. Outputs contain a URL, content hash, normalized labels, counts, status, and review state.
- Output is a candidate research package only. It must not be imported directly into `app/src/data` or published as questions.

Nowcoder's public disclaimer states that community content copyright is jointly held and commercial reproduction requires written authorization. This tool therefore derives non-expressive topic signals and does not reproduce the source material. Operators remain responsible for checking the current site rules before every live run.

## Approval workflow

1. Add search-discovered links to `manifests/pilot-100.json` with `approvalStatus: "discovered"`.
2. Review URL, page type, query, date, and public accessibility in a normal logged-out browser.
3. Change only suitable public pages to `approved`; use `rejected` plus `reviewNote` for the rest.
4. Run validation and dry-run. These commands make zero network requests.
5. Obtain explicit approval for a one-page live smoke test before running the network command.
6. Review all output signals manually before using their aggregate topic counts as writing priorities.

`candidate-review.csv` is a spreadsheet-safe review view, not an import file. Editing it does not approve a source. Record the IDs you accept/reject, then apply those decisions to the JSON manifest (or give the ID list to the maintainer to apply).

## Commands

From `app/`:

```powershell
npm run test:intake
npm run intake:validate
npm run intake:dry-run
npm run intake:review -- output=quality/nowcoder-intake/candidate-review.csv
```

The network command requires both acknowledgements, an explicit approved manifest, an empty output directory, and a page cap:

```powershell
npm run intake:run -- manifest=quality/nowcoder-intake/manifests/pilot-100.json output=quality/nowcoder-intake/runs/smoke-001 allow-network acknowledge-public-only max-pages=1
```

Do not run this command until the candidate manifest has been reviewed and approved. A full pilot must proceed through 1 page, then 10 pages, then at most 100 pages.

## Statuses

- `success`: topic-level signal produced.
- `robots_disallowed`: robots rules deny the path.
- `robots_unavailable`: robots could not be safely retrieved or interpreted; no page request was made.
- `redirect_blocked`: redirect violates HTTPS, hostname, credential, query, or private-host policy.
- `unsupported_page`: page type/content type mismatch, login, CAPTCHA, or paid content.
- `insufficient_signal`: no reliable technical topic was found.
- `privacy_rejected`: output privacy gate failed.
- `duplicate_content`: normalized content hash already contributed.
- `network_error`: timeout, response size, HTTP status, or transport failure.

`SIGINT` stops after the current operation and still writes an atomic, readable report. Output directories are ignored by Git by default.

## Candidate package

- `source-signals.jsonl`: one normalized, review-pending signal per unique source content.
- `source-signals.csv`: spreadsheet-safe review view with formula-injection protection.
- `topic-summary.json`: unique-content topic counts and suggested coverage gaps.
- `intake-report.json`: run totals, status counts, and stop reason.
- `rejected-sources.jsonl`: source IDs, URLs, status, and non-content reason.

The package does not generate questions. Original question writing requires independent technical evidence, two reviewer roles, deterministic quality gates, and human annotation.

## Manual annotation module

Nowcoder pages that require your own login must not be passed to the network intake runner. Use the separate loopback-only annotation module instead:

```powershell
cd app
npm run annotation:start
```

Open the printed `http://127.0.0.1:4178` URL in your desktop browser. A different port can be selected with:

```powershell
npm run annotation:start -- port=4180
```

The local module never opens or fetches Nowcoder itself. Click **打开来源** to open the source in a normal browser tab, sign in to Nowcoder there if needed, read it, and return to the local module to record only standardized signals.

For each source:

1. Decide whether it is relevant to the two target LLM roles.
2. For relevant sources, select the role, recruiting stage, at least one topic, and any useful follow-up or misconception tags.
3. For multiple-choice sources, also select a cognitive level and note distractor or answer-cue problems when present.
4. Optionally write one sentence in your own words, up to 100 characters.
5. Save and continue, or choose a structured skip reason.

Do not paste question stems, choices, answers, explanations, post paragraphs, usernames, resumes, phone numbers, email addresses, WeChat IDs, QQ numbers, passwords, cookies, or access tokens. The short summary is for your own non-expressive paraphrase only.

Progress is stored atomically in `quality/nowcoder-intake/manual-data/annotations.json`. The whole `manual-data` directory is ignored by Git. **导出结果** creates a timestamped directory containing JSON, spreadsheet-safe CSV, topic counts, and an annotation report.

Manual labels do not change `pilot-100.json` approval status. They are topic-priority evidence only and must still go through independent technical sources, original question writing, evidence review, item-quality review, deterministic gates, and mobile human review before entering the product.

Run the local test suite with:

```powershell
npm run test:annotation-tool
```
