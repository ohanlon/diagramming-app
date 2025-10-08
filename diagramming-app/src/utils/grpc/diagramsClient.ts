/**
 * Lightweight gRPC client wrapper for Diagrams service.
 *
 * This wrapper attempts to dynamically import a generated Connect client (if you run codegen),
 * and otherwise falls back to the existing REST endpoints. The goal is to let the UI call
 * diagram listing via this uniform API while we incrementally add real Connect clients.
 */
import { useDiagramStore } from '../../store/useDiagramStore';
import { apiFetch } from '../apiFetch';

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
  try {
    const resp = await apiFetch(`${serverUrl}/diagrams`, { method: 'GET' });
    if (!resp.ok) return [];
    const json = await resp.json();
    return json.diagrams || [];
  } catch (e) {
    console.error('Failed to list diagrams', e);
    return [];
  }
}

export async function listSharedDiagrams(): Promise<DiagramListItem[]> {
  const serverUrl = useDiagramStore.getState().serverUrl;
  try {
    const resp = await apiFetch(`${serverUrl}/diagrams/shared`, { method: 'GET' });
    if (!resp.ok) return [];
    const json = await resp.json();
    return json.diagrams || [];
  } catch (e) {
    console.error('Failed to list shared diagrams', e);
    return [];
  }
}
