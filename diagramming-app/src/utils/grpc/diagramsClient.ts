/**
 * Lightweight gRPC client wrapper for Diagrams service.
 *
 * This wrapper attempts to dynamically import a generated Connect client (if you run codegen),
 * and otherwise falls back to the existing REST endpoints. The goal is to let the UI call
 * diagram listing via this uniform API while we incrementally add real Connect clients.
 */
import { useDiagramStore } from '../../store/useDiagramStore';

export type DiagramListItem = {
  id: string;
  diagramName: string;
  thumbnailDataUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  ownerUserId?: string | null;
};

export async function listDiagrams(): Promise<DiagramListItem[]> {
  const serverUrl = useDiagramStore.getState().serverUrl;
  // Try to dynamically load a generated Connect client, if present. This allows
  // running codegen and flipping the client without changing UI code.
  try {
    // Use import.meta.glob to detect generated client modules at build time
    // without triggering a network fetch for a missing file. If the
    // generated client exists (e.g. after running codegen) we'll dynamically
    // import it via the function returned by the glob map. This avoids the
    // noisy 404 in the network panel when the generated client is absent.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const moduleMap: Record<string, () => Promise<any>> = import.meta.glob('../../generated/diagrams_connect.*');
    const keys = Object.keys(moduleMap || {});
    if (keys.length > 0) {
      const loader = moduleMap[keys[0]];
      if (loader) {
        const mod = await loader();
        if (mod && mod.DiagramsService) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const client: any = new mod.DiagramsService(`${serverUrl}`);
          const resp = await client.listDiagrams({});
          return (resp && resp.diagrams) || [];
        }
      }
    }
  } catch (e) {
    // No generated client available yet — fall back to REST.
  }

  // REST fallback
  try {
    const { apiFetch } = await import('../apiFetch');
    const resp = await apiFetch(`${serverUrl}/diagrams`, { method: 'GET' });
    if (!resp.ok) return [];
    const json = await resp.json();
    return json.diagrams || [];
  } catch (e) {
    console.error('Failed to list diagrams (fallback)', e);
    return [];
  }
}

export async function listSharedDiagrams(): Promise<DiagramListItem[]> {
  const serverUrl = useDiagramStore.getState().serverUrl;
  try {
    const moduleMap: Record<string, () => Promise<any>> = import.meta.glob('../../generated/diagrams_connect.*');
    const keys = Object.keys(moduleMap || {});
    if (keys.length > 0) {
      const loader = moduleMap[keys[0]];
      if (loader) {
        const mod = await loader();
        if (mod && mod.DiagramsService) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const client: any = new mod.DiagramsService(`${serverUrl}`);
          const resp = await client.listSharedDiagrams?.({}) || { diagrams: [] };
          return resp.diagrams || [];
        }
      }
    }
  } catch (e) {
    // No generated client available yet — fall back to REST.
  }

  // REST fallback
  try {
    const { apiFetch } = await import('../apiFetch');
    const resp = await apiFetch(`${serverUrl}/diagrams/shared`, { method: 'GET' });
    if (!resp.ok) return [];
    const json = await resp.json();
    return json.diagrams || [];
  } catch (e) {
    console.error('Failed to list shared diagrams (fallback)', e);
    return [];
  }
}
