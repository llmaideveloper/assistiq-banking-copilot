# AssistIQ Advanced UI + Audit Dashboard Upgrade

This package adds:

- Role-based workflow simulation on the main page
- RAG transparency panel
- Similarity score display for policy evidence
- GitHub README footer link
- AI audit dashboard at `/audit`
- Audit API route at `/api/audit`

## Files

Copy these files into your project:

```text
app/page.tsx
app/api/audit/route.ts
app/audit/page.tsx
```

Then append the CSS from:

```text
globals-additions.css
```

to:

```text
app/globals.css
```

## Required environment variable

Add this locally and in Netlify:

```env
NEXT_PUBLIC_GITHUB_REPO_URL=https://github.com/llmaideveloper/assistiq-banking-copilot/blob/main/README.md
```

## Build

```bash
cd ~/assistiq-run
rm -rf .next
npm run build
npm run dev
```

## Commit

```bash
git add app/page.tsx app/api/audit/route.ts app/audit/page.tsx app/globals.css
git commit -m "Add audit dashboard and RAG transparency UI"
git push
```
