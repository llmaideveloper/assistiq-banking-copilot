# AssistIQ Banking Copilot — Next.js API Route Version

This version runs fully as a Next.js app with an internal API route:

- UI: `app/page.tsx`
- Demo API: `app/api/assist/route.ts`

No Render backend and no Netlify Functions are required for the demo flow.

## Local run

```bash
npm install
npm run dev
```

Open the URL printed by Next.js, for example:

```text
http://192.168.252.2:3000
```

Click **Run AI Case Review**.

## Test API directly

```bash
curl -X POST http://localhost:3000/api/assist \
  -H "Content-Type: application/json" \
  -d '{"customerId":"C1001","question":"Is this customer eligible for hardship payment plan?"}'
```

## Netlify deploy

Use:

- Base directory: this frontend folder
- Build command: `npm run build`
- Publish directory: `.next`

The API route `/api/assist` will be handled by Netlify's Next.js support.
