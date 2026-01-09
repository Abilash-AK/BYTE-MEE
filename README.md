## CoLearn

Local-first build of the CoLearn app with a simple email-based auth flow (no Mocha dependencies).

To run the devserver:
```
npm install
npm run dev
```

Google OAuth setup (local):
- In your Google Cloud console OAuth client, set redirect URI to `http://localhost:5173/auth/callback`.
- Create a `.dev.vars` (or environment vars) with:
	- `GOOGLE_CLIENT_ID=your_client_id`
	- `GOOGLE_CLIENT_SECRET=your_client_secret`
	- Optional: `GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback`

Flow:
- Frontend fetches `/api/oauth/google/redirect_url` and redirects to Google.
- Google sends the user back to `/auth/callback?code=...`.
- Frontend posts the code to `/api/auth/google/callback`, backend exchanges it for tokens, fetches profile, and sets the session cookie.
