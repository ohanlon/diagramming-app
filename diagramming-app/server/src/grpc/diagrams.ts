import type { Application, Request, Response } from 'express';
import { listDiagramsByUser, listDiagramsSharedWithUserId } from '../diagramsStore';

/**
 * Mounts lightweight gRPC-style HTTP endpoints for Diagrams service.
 *
 * These endpoints intentionally mirror the request paths used by gRPC/Connect
 * so the real Connect handlers can later replace them without changing the client.
 * For now they accept JSON POST calls and return JSON bodies, delegating to
 * existing store functions. They are protected by the same combinedAuth middleware
 * at the caller site (index.ts should call this after mounting combinedAuth if needed).
 */
export function mountDiagramsGrpcShims(app: Application) {
  // ListDiagrams: returns diagrams owned by the authenticated user
  app.post('/diagrams.v1.Diagrams/ListDiagrams', async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as { id?: string } | undefined;
      const userId = user?.id || null;
      const rows = await listDiagramsByUser(userId);
      res.json({ diagrams: rows });
    } catch (e) {
      console.error('ListDiagrams shim failed', e);
      res.status(500).json({ error: 'ListDiagrams failed' });
    }
  });

  // ListSharedDiagrams: returns diagrams shared with the authenticated user
  app.post('/diagrams.v1.Diagrams/ListSharedDiagrams', async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as { id?: string } | undefined;
      if (!user || !user.id) return res.status(401).json({ error: 'Authentication required' });
      const rows = await listDiagramsSharedWithUserId(user.id);
      res.json({ diagrams: rows });
    } catch (e) {
      console.error('ListSharedDiagrams shim failed', e);
      res.status(500).json({ error: 'ListSharedDiagrams failed' });
    }
  });
}
