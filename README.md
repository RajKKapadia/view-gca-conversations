# View GCA Conversations

A Next.js app for browsing and inspecting Google Dialogflow CX conversation history.

## Features

- Admin login (single credential pair from environment variables)
- Session list with:
  - Date filtering (single date or range)
  - Pagination (`Load More`)
- Conversation detail view with user/agent turns and latency values
- Protected routes via NextAuth middleware/proxy

## Tech Stack

- Next.js 16 (App Router)
- React 19
- NextAuth v5 (credentials provider)
- Google Auth Library (Dialogflow API access)
- Tailwind CSS 4

## Prerequisites

- Node.js 20+
- `pnpm` (recommended) or `npm`
- A Google Cloud service account with access to Dialogflow CX conversation data

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Fill required values in `.env`.

4. Start the dev server:

```bash
pnpm dev
```

5. Open `http://localhost:3000`.

## Environment Variables

Use `.env.example` as the source of truth.

- `GCP_SERVICE_ACCOUNT_JSON`: Full service account JSON as a single string.
- `CA_PROJECT_ID`: Google Cloud project ID.
- `CA_LOCATION`: Dialogflow location (for example `global` or `us-central1`).
- `CA_AGENT_ID`: Dialogflow CX agent ID.
- `ADMIN_EMAIL`: Admin login email.
- `ADMIN_PASSWORD`: Admin login password.
- `AUTH_SECRET`: NextAuth secret.
- `AUTH_TRUST_HOST`: Set `true` behind trusted proxies / production hosting.

## Scripts

- `pnpm dev`: Start local dev server.
- `pnpm build`: Build for production.
- `pnpm start`: Start production server.
- `pnpm lint`: Run ESLint.

## API Routes

- `GET /api/sessions`
  - Optional query params:
    - `startDate` (ISO string)
    - `endDate` (ISO string)
    - `pageToken`
  - Returns paginated session list.
- `GET /api/conversations/:id`
  - Returns parsed conversation interactions for a session.
- `GET/POST /api/auth/*`
  - NextAuth handlers.

## Notes

- Conversation filtering by date is done after fetching because Dialogflow conversations API does not provide server-side start-time filtering.
- In development, credentials are loaded from `GCP_SERVICE_ACCOUNT_JSON`. In non-development environments, default Google credentials are used.
