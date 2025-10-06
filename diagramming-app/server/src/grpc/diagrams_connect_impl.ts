import type { Application } from 'express';
// Use runtime require for createHandler so TypeScript does not attempt to
// resolve the module at compile time before dependencies are installed.
let createHandler: any = null;
try {
  // Attempt to require the connect-node runtime and find the createHandler
  // implementation. Different package versions or bundling setups may export
  // the function as a named export, a default export, or under a default
  // namespace. Be defensive here and only use a resolved function.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const connectNodeMod: any = require('@bufbuild/connect-node');
  if (typeof connectNodeMod.createHandler === 'function') {
    createHandler = connectNodeMod.createHandler;
  } else if (typeof connectNodeMod.default === 'function') {
    // Some ESM/CJS interop surfaces a default function
    createHandler = connectNodeMod.default;
  } else if (connectNodeMod.default && typeof connectNodeMod.default.createHandler === 'function') {
    createHandler = connectNodeMod.default.createHandler;
  } else {
    // If nothing usable was found, leave createHandler null — the mount
    // function will handle this case gracefully.
    createHandler = null;
  }
} catch (e) {
  // Not available yet — will be handled when attempting to mount the handler.
  createHandler = null;
}
import { listDiagramsByUser, listDiagramsSharedWithUserId } from '../diagramsStore';

/**
 * Mount a handwritten Connect-style handler for the Diagrams service.
 *
 * This implementation is intentionally minimal and uses `any` for service
 * descriptors so it behaves like a generated handler would. The handler
 * extracts the authenticated user from the underlying Express request if
 * present (combinedAuth middleware sets `req.user`).
 */
export function mountDiagramsConnectHandler(app: Application) {
  try {
    // Minimal service descriptor (handwritten) to satisfy createHandler.
    const serviceDef: any = {
      typeName: 'diagrams.v1.Diagrams',
      methods: {
        ListDiagrams: { name: 'ListDiagrams' },
        ListSharedDiagrams: { name: 'ListSharedDiagrams' },
      },
    };

    const impl: any = {
      // Implementation mirrors the generated Connect handler signature loosely.
      async listDiagrams(req: any) {
        // Try to find the underlying Express request where combinedAuth attaches user
        const expressReq = req?.raw?.req || req?.transport?.request || req?.req || null;
        const userId = expressReq?.user?.id || null;
        const rows = await listDiagramsByUser(userId);
        return { body: { diagrams: rows } };
      },
      async listSharedDiagrams(req: any) {
        const expressReq = req?.raw?.req || req?.transport?.request || req?.req || null;
        const userId = expressReq?.user?.id;
        if (!userId) throw new Error('Authentication required');
        const rows = await listDiagramsSharedWithUserId(userId);
        return { body: { diagrams: rows } };
      },
    };

    if (!createHandler || typeof createHandler !== 'function') {
      console.warn('createHandler function not found on @bufbuild/connect-node; skipping Connect handler mount');
      return false;
    }

    const handler = createHandler(serviceDef, impl);
    // Mount the handler at the service root path. Connect-generated clients
    // call routes like /diagrams.v1.Diagrams/ListDiagrams; createHandler will
    // route based on the service definition when mounted at '/'. We mount at
    // '/' to mirror that behavior.
    app.use(handler as any);
    console.log('Mounted handwritten Connect Diagrams handler');
    return true;
  } catch (e) {
    console.warn('Failed to mount Connect handler:', e);
    return false;
  }
}
