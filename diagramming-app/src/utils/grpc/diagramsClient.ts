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
    const path = '../../generated/' + 'diagrams_connect';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import(path as any);
    if (mod && mod.DiagramsService) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client: any = new mod.DiagramsService(`${serverUrl}`);
      const resp = await client.listDiagrams({});
      return (resp && resp.diagrams) || [];
    }
  } catch (e) {
    // No generated client available yet — fall back to REST.
    // Keep this silent to avoid noisy logs during development.
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
    const path = '../../generated/' + 'diagrams_connect';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import(path as any);
    if (mod && mod.DiagramsService) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client: any = new mod.DiagramsService(`${serverUrl}`);
      const resp = await client.listSharedDiagrams?.({}) || { diagrams: [] };
      return resp.diagrams || [];
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
