Protocol buffers and Connect codegen
==================================

This repository uses Protocol Buffers to define service contracts and will
use Connect (https://connect.build/) for a typed gRPC-style client/server
experience in TypeScript. The repository includes an initial proto at
`proto/diagrams.proto` and configuration files for `buf` code generation.

What to install
---------------

- buf CLI (recommended): https://docs.buf.build/installation
  - Used to run `buf generate` which reads `buf.gen.yaml` and invokes the
    configured plugins.
- protoc (optional): If you prefer to call protoc directly instead of buf
  you must have `protoc` installed: https://grpc.io/docs/protoc-installation/
- Connect codegen plugin (protoc-gen-connect-es): available as an npm package
  or via the Connect release binaries. You can install it locally via npm if
  available, or place it on your PATH.

Quick generate (recommended using buf)
-------------------------------------

1. Install buf CLI following instructions for your platform.
2. Ensure a Connect plugin (protoc-gen-connect-es) is available on PATH or
   available via npx. Example using npx (when plugin is published):

   npx -y protoc-gen-connect-es --version

3. Run the buf generation from the workspace root:

   buf generate

   This will read `buf.gen.yaml` and attempt to run `protoc-gen-connect-es`,
   producing generated TypeScript code in `src/generated` as configured.

Alternative: use protoc directly (example *nix)
----------------------------------------------

1. Install protoc and the plugin.
2. Run (example):

   protoc --plugin=protoc-gen-connect-es=$(npm bin)/protoc-gen-connect-es \
     --connect-es_out=src/generated -I proto proto/*.proto

On Windows use the appropriate path to `protoc-gen-connect-es` (e.g. using `where`)
or invoke via npx:

   npx protoc-gen-connect-es --connect-es_out=src/generated -I proto proto/*.proto

Notes
-----
- The current codebase contains a lightweight dynamic import wrapper that
  will attempt to load a generated Connect client module from
  `src/generated/diagrams_connect` if present. If codegen has not been run
  the wrapper will fall back to the existing REST endpoints.
- After running codegen, the client will attempt to use the generated Connect
  runtime. At that point, make sure the client runtime packages are installed
  (see package.json). The server-side Connect runtime also needs to be
  installed and handlers wired; the repository includes a shimbed HTTP route
  that mirrors Connect paths so you can test incrementally.

Local protoc downloader
-----------------------

If you don't want to install protoc globally you can use the included helper
to download a prebuilt protoc binary into the repository. This is useful for
CI or when working on Windows where installing global tools can be cumbersome.

Run:

  npm run proto:install-protoc

This will attempt to download a platform-appropriate protoc release and
place it under `tools/protoc`. After running, add `tools/protoc/bin` to your
PATH or invoke `tools/protoc/bin/protoc` directly from the helper scripts.

You can customize the version via the PROTOC_VERSION environment variable,
for example:

  PROTOC_VERSION=23.4.1 npm run proto:install-protoc

