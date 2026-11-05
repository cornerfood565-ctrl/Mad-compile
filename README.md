# Mad-compile

Mad-compile is a collaborative developer database for projects, source code, snippets, assets, configuration templates and technical notes.

## Stack

- React + TypeScript + Vite
- Tailwind-ready custom dark UI foundation
- Supabase Auth, PostgreSQL and private Storage
- Vercel deployment

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Set these values in `.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (Supabase publishable key or legacy anon key)

Never put a Supabase service-role key in frontend environment variables or commit secrets.

## Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor** in the Supabase dashboard.
3. Open `supabase/schema.sql` in this repository and copy its contents into the SQL Editor. Paste the SQL itself, not the filename.
4. Run the SQL script.
5. Copy the project URL and publishable/anon key into your local `.env` and Vercel environment variables.
6. Enable email authentication in Supabase Auth.

The schema creates workspace membership, roles, project and file metadata, notes, snippets, audit activity, invitations, private Storage buckets and RLS policies.

## Vercel

Import this repository into Vercel. The default Vite build settings are:

- Build command: `npm run build`
- Output directory: `dist`

Add the two Vite environment variables in Vercel and redeploy.

## Current implementation status

The first commit provides the responsive titanium/red dashboard, navigation, project creation preview, auth form wiring and initial Supabase schema. Database-backed CRUD, team invitations, source editor, uploads, versioning and real usage metrics are subsequent implementation milestones. The dashboard's sample records are preview data, not persisted database records.

## Security notes

- Keep all Storage buckets private.
- RLS is enabled on application tables.
- Upload object paths must begin with the workspace UUID.
- Use Supabase Edge Functions or another trusted server for privileged invitation workflows.
- Do not store raw API secrets in ordinary configuration records. Use a server-side encrypted secret-management flow for real credentials.
