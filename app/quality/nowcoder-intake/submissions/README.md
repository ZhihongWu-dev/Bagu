# Annotation submissions

This directory accepts one public, structured annotation contribution for the
current pilot manifest:

```text
pilot-100-v1.json
```

Generate the file from the local annotation UI only after all 59 sources are
completed or skipped. Validate it from `app/` with:

```powershell
npm run annotation:validate-submission
```

Do not add raw exports, summaries, notes, page text, answers, URLs, personal
information, cookies, or credentials. CI rejects additional JSON files and any
field outside the public submission schema.

The accepted artifact is research evidence only. Merging it does not import
content into the Bagu question bank.
