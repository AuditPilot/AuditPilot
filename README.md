# AuditPilot Frontend

React + Vite frontend for AuditPilot. The backend lives in the sibling project at `D:\AuditPilot-API` and runs independently.

## Local development

```powershell
npm ci
npm run dev
```

Vite serves the app at `http://localhost:5000` and proxies `/api` to `http://localhost:5002` by default. Start the API separately from `D:\AuditPilot-API`. Set `VITE_API_PROXY` if the API runs on a different port.

## Build and run the frontend container

```powershell
npm run build:client
docker compose up --build -d
```

The web container is available at `http://localhost:4173`. By default nginx forwards `/api` to `host.docker.internal:8080`; set `API_UPSTREAM` if the API runs elsewhere. For a separately hosted API origin, build with `VITE_API_BASE=https://api.example.com`.

## API project

The standalone backend source, Dockerfile, and Docker Compose configuration are in `D:\AuditPilot-API`. See its README for setup and required environment values.
