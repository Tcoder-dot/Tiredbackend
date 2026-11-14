# FLOATE Backend

The application lives in `FLOATE-V2-BACKEND-ORIGINAL/`. The root package
declares its dependencies so tools that expect a standard Node app at the
repository root can install and launch it without moving the application files.

```sh
npm install
npm run dev
```

For production, run `npm run build` followed by `npm start`. Configure runtime
secrets using the variables documented in
`FLOATE-V2-BACKEND-ORIGINAL/.env.example`. The server requires
`FLOATE_JWT_SECRET` and `SESSION_SECRET` (each at least 32 characters) to
start; add both to the AI Studio Secrets panel or your local environment. For
local testing, generate each with `openssl rand -hex 32`.
