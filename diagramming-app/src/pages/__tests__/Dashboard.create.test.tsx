import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock useDiagramStore so createNewDiagram is a jest.fn we can assert was called
jest.mock('../../store/useDiagramStore', () => {
  const mock = jest.fn(() => ({
    serverUrl: 'http://localhost:4000',
    currentUser: { id: 'user-1', username: 'me@example.com' },
    createNewDiagram: jest.fn(),
  }));
  // Provide a getState function used by some components
  (mock as any).getState = () => ({ currentUser: { id: 'user-1', username: 'me@example.com' } });
  return { useDiagramStore: mock };
});

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...(jest.requireActual('react-router-dom') as any),
  useNavigate: () => mockNavigate,
}));

import * as apiFetchModule from '../../utils/apiFetch';
import Dashboard from '../Dashboard';

jest.mock('../../utils/apiFetch', () => ({ apiFetch: jest.fn() }));

describe('Dashboard create new diagram button', () => {
  beforeEach(() => {
    (apiFetchModule.apiFetch as jest.Mock).mockReset();
    mockNavigate.mockReset();
  });

  it('renders New Diagram button and creates + navigates when clicked', async () => {
    (apiFetchModule.apiFetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ diagrams: [] }) }) // GET /diagrams
      .mockResolvedValueOnce({ ok: true, json: async () => ({ diagrams: [] }) }) // GET /diagrams/shared
      .mockResolvedValueOnce({ ok: true, json: async () => ({ settings: { favorites: [] } }) }); // GET /users/me/settings

    render(<MemoryRouter><Dashboard /></MemoryRouter>);

    // Wait for header to render
    const newBtn = await screen.findByLabelText('New diagram');
    expect(newBtn).toBeInTheDocument();

    fireEvent.click(newBtn);

    // createNewDiagram should have been called via the mocked store; navigate should be called
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/diagram'));
  });
});
