import { createInvite, getInviteByToken, listInvitesForEmail } from '../invitesStore';
import { pool } from '../db';

jest.mock('../db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe('invitesStore', () => {
  beforeEach(() => {
    (pool.query as jest.Mock).mockReset();
  });

  it('creates an invite and returns the inserted row', async () => {
    const fakeRow = { id: 'uuid-1', token: 'token-1', invited_email: 'alice@example.com', diagram_id: 'd1' };
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [fakeRow] });
    const res = await createInvite('d1', 'alice@example.com', 'inviter-1', null);
    expect(res).toEqual(fakeRow);
    expect(pool.query).toHaveBeenCalled();
  });

  it('retrieves invites for an email', async () => {
    const fakeRows = [{ id: 'uuid-2', invited_email: 'bob@example.com', diagram_id: 'd2' }];
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: fakeRows });
    const rows = await listInvitesForEmail('bob@example.com');
    expect(rows).toEqual(fakeRows);
    expect(pool.query).toHaveBeenCalled();
  });
});
