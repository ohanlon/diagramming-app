Protocol buffer & Connect codegen workflow
=========================================

This project uses Protocol Buffers to define APIs and Connect for a modern
gRPC-style TypeScript runtime. The repo includes a small migration path so
you can generate clients and servers incrementally and flip the UI to use
generated clients without breaking existing REST endpoints.

Quick steps
-----------

1. Install buf CLI
   - macOS (Homebrew): brew install bufbuild/buf/buf
   - Windows: download release from https://github.com/bufbuild/buf/releases or use choco if available

2. Install any required codegen plugin (for instance protoc-gen-connect-es) so
   buf/protoc can find it. You can often install via npm or use the official
   binaries. See proto/README.md for examples.

3. Run codegen (buf):

   npm run proto:gen

   This will invoke `buf generate` which reads `buf.gen.yaml` and writes
   generated code to `src/generated`.

4. Run the frontend and backend. The frontend wrapper in
   `src/utils/grpc/diagramsClient.ts` will attempt to dynamically import the
   generated client module (e.g. `src/generated/diagrams_connect`) when it exists
   and otherwise fall back to the REST endpoint.

Flipping the frontend to use Connect clients
-------------------------------------------

- Once codegen produces the client code (in `src/generated`), the runtime
  wrapper will pick it up automatically (dynamic import). Ensure the
  client runtime dependency `@bufbuild/connect-web` is installed (already
  added to package.json).
- Optionally remove the REST fallback in `src/utils/grpc/diagramsClient.ts`
  once all UI pages use gRPC.

Server-side
-----------

- The server currently contains a shim (`server/src/grpc/diagrams.ts`) that
  exposes Connect-like HTTP endpoints and delegates to the existing store
  functions. When you add generated server handlers, replace the shim by
  mounting the generated handlers (e.g. using `createHandler()` from
  `@bufbuild/connect-node`).

Next steps (recommended):
- Generate clients with `buf generate` and verify the Dashboard picks up
  the generated client (dashboard calls listDiagrams via the wrapper).
- Implement generated server handlers and mount them using Connect runtime
  (replace the shim once verified).
