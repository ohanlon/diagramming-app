import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import * as apiFetchModule from '../../utils/apiFetch';
import Dashboard from '../Dashboard';

jest.mock('../../utils/apiFetch', () => ({ apiFetch: jest.fn() }));

jest.mock('../../store/useDiagramStore', () => ({
  useDiagramStore: () => ({ serverUrl: 'http://localhost:4000', currentUser: { id: 'user-1', username: 'me@example.com' } }),
}));

describe('Dashboard shared with me display', () => {
  beforeEach(() => {
    (apiFetchModule.apiFetch as jest.Mock).mockReset();
  });

  it('shows shared diagrams in All and sidebar when present', async () => {
    (apiFetchModule.apiFetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ diagrams: [] }) }) // GET /diagrams (owned)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ diagrams: [{ id: 'shared-1', diagramName: 'Shared Doc', thumbnailDataUrl: null, ownerUserId: 'other-user' }] }) }) // GET /diagrams/shared
      .mockResolvedValueOnce({ ok: true, json: async () => ({ settings: { favorites: [] } }) }); // GET /users/me/settings

    render(<Dashboard />);

    // Sidebar should show My Diagrams and Shared (1)
    await waitFor(() => expect(screen.getByText(/My Diagrams \(0\)/)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/Shared \(1\)/)).toBeInTheDocument());

    // Header should reflect the default 'All' selection
    expect(screen.getByText('All Diagrams')).toBeInTheDocument();

    // The shared diagram card should be visible in the grid
    await waitFor(() => expect(screen.getByText('Shared Doc')).toBeInTheDocument());
  });
});
