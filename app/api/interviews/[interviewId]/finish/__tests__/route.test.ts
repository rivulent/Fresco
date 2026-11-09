import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findUniqueMock, updateMock, cookieSetMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  updateMock: vi.fn(),
  cookieSetMock: vi.fn(),
}));

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, after: vi.fn() };
});

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({ set: cookieSetMock })),
}));

vi.mock('~/lib/db', () => ({
  prisma: {
    interview: {
      findUnique: findUniqueMock,
      update: updateMock,
    },
  },
}));

vi.mock('~/lib/activityFeed', () => ({ addEvent: vi.fn() }));
vi.mock('~/lib/cache', () => ({ safeRevalidateTag: vi.fn() }));
vi.mock('~/lib/posthog-server', () => ({
  captureException: vi.fn(),
  flushPostHog: vi.fn(),
}));

import { POST } from '../route';

function finish() {
  return POST(
    new Request('http://localhost/api/interviews/interview-1/finish'),
    { params: Promise.resolve({ interviewId: 'interview-1' }) },
  );
}

describe('interview finish route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateMock.mockResolvedValue({
      protocolId: 'protocol-1',
      network: { nodes: [], edges: [] },
      participant: { label: null, identifier: 'p-1' },
    });
  });

  it('refuses to finish an interview whose window has closed', async () => {
    findUniqueMock.mockResolvedValue({
      expiresAt: new Date(Date.now() - 60_000),
    });

    const response = await finish();

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toEqual({
      error: 'Interview expired',
      expired: true,
    });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('finishes an interview whose window is still open', async () => {
    findUniqueMock.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
    });

    const response = await finish();

    expect(response.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'interview-1' } }),
    );
  });
});
