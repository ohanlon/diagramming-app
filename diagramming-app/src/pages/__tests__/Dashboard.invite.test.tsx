import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from '../Dashboard';
import * as apiFetchModule from '../../utils/apiFetch';
import '@testing-library/jest-dom';

jest.mock('../../utils/apiFetch', () => ({ apiFetch: jest.fn() }));

// Mock useDiagramStore to provide serverUrl and currentUser
jest.mock('../../store/useDiagramStore', () => ({
  useDiagramStore: () => ({ serverUrl: 'http://localhost:4000', currentUser: { id: 'user-1', username: 'owner@example.com' } }),
}));

describe('Dashboard share/invite flows', () => {
  beforeEach(() => {
    (apiFetchModule.apiFetch as jest.Mock).mockReset();
  });

  it('shows invite option when share returns missing emails and can send invites', async () => {
    // Setup initial diagrams list response
    (apiFetchModule.apiFetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ diagrams: [{ id: 'd1', diagramName: 'Doc1', ownerUserId: 'user-1' }] }) }) // GET /diagrams
      .mockResolvedValueOnce({ ok: true, json: async () => ({ diagrams: [] }) }) // GET /diagrams/shared
      .mockResolvedValueOnce({ ok: true, json: async () => ({ settings: { favorites: [] } }) }); // GET /users/me/settings

    render(<Dashboard />);

    // Wait for the diagram card to render
    await waitFor(() => expect(screen.getByText('Doc1')).toBeInTheDocument());

    // Open menu and click Share
    const menuButtons = screen.getAllByLabelText('more');
    fireEvent.click(menuButtons[0]);
    const shareMenuItem = await screen.findByText('Share');
    fireEvent.click(shareMenuItem);

    // Type an unregistered email and click Share
    const textarea = await screen.findByPlaceholderText('email1@example.com, email2@example.com');
    fireEvent.change(textarea, { target: { value: 'newuser@example.com' } });

    // Mock share endpoint returning 400 with missing list
    (apiFetchModule.apiFetch as jest.Mock).mockResolvedValueOnce({ ok: false, json: async () => ({ missing: ['newuser@example.com'] }) });

    const shareButton = screen.getByText('Share');
    fireEvent.click(shareButton);

    // Expect error message about missing users
    await waitFor(() => expect(screen.getByText(/Some emails are not registered users/)).toBeInTheDocument());

    // Mock invite endpoint success
    (apiFetchModule.apiFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ invites: [{ id: 'i1' }] }) });

    const inviteButton = screen.getByText('Send invites');
    fireEvent.click(inviteButton);

    // Expect success snackbar text
    await waitFor(() => expect(screen.getByText('Invites sent')).toBeInTheDocument());
  });
});
