# AuditPilot API

Standalone Express API project, separated from the frontend in `D:\AuditPilot`.

## Local development

```powershell
Copy-Item .env.example .env
npm ci
npm run dev
```

The API listens on port 8080 by default and expects MongoDB at `MONGODB_URI`.

## Docker

```powershell
Copy-Item .env.example .env
# Set secure JWT_SECRET and ENCRYPTION_KEY values in .env
docker compose up --build -d
```

The API is published on `http://localhost:8080`; MongoDB runs in its own container. Set `CLIENT_ORIGIN` to the frontend origin(s). For separate HTTPS sites, configure `COOKIE_SAMESITE=none`.
