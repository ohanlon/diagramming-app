Protobuf & Connect support has been removed from this repository.

The previous codegen workflow and migration helpers were deprecated and
removed. The server and client now use REST endpoints for runtime network
operations. Any generated code (src/generated) or tooling (protoc/buf) is
no longer required.

Local cleanup and lockfile regeneration
--------------------------------------

If you previously ran the codegen helpers or downloaded vendored protoc
binaries, there may be leftover artifacts on your machine under the
`tools/` directory. To remove them locally and regenerate package lockfiles:

- Run `scripts/cleanup_protobuf_artifacts.cmd` (Windows) to remove the
	`tools/protoc`, `tools/tmp`, and `tools/plugins` directories.
- Run `scripts/regenerate_lockfiles.cmd` to run `npm install` in the root
	and `server/` directories and refresh the `package-lock.json` files.

After regenerating lockfiles, inspect the changes and commit the updated
lockfiles if appropriate for your project's release process.
