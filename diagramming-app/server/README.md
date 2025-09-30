Diagramming App - Server

This folder contains a TypeScript Express server that implements the server-side API for persisting diagrams.

Quickstart (Postgres + Basic Auth)

1. Create a Postgres database and set DATABASE_URL (example below uses a local DB):
   export DATABASE_URL=postgres://user:password@localhost:5432/diagramdb

2. Create admin user and password via environment variables:
   export ADMIN_USER=admin
   export ADMIN_PASSWORD=changeme

3. Install dependencies:
   cd server; npm install

4. Run DB migration to create tables (requires psql and DATABASE_URL):
   npm run migrate

5. Run in development mode (auto-restarts):
   npm run dev

6. Server listens on port 4000 by default. Endpoints (protected with HTTP Basic Auth):
   - POST /diagrams
   - GET /diagrams/{id}
   - PUT /diagrams/{id}
   - PATCH /diagrams/{id}

Notes

- The server persists diagram state (JSON) in a Postgres table `diagrams`. For each diagram, `state` is stored as JSONB. The server strips `svgContent` from shapes before saving so raw SVGs are not persisted.
- Use the Basic Auth credentials set in ADMIN_USER and ADMIN_PASSWORD to authenticate when calling the API (Authorization: Basic base64(user:pass)).
- For production, secure secrets in a safer way (e.g., secrets manager) and enable TLS. Consider adding proper authentication and authorization rather than a single shared Basic credential.
