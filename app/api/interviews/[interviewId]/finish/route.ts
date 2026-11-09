import { cookies } from 'next/headers';
import { after, NextResponse } from 'next/server';

import { ensureError } from '@codaco/shared-consts';
import { addEvent } from '~/lib/activityFeed';
import { safeRevalidateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { captureException, flushPostHog } from '~/lib/posthog-server';
import { isInterviewExpired } from '~/utils/isInterviewExpired';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ interviewId: string }> },
) {
  const { interviewId } = await params;

  try {
    // Rivulent: an interview whose window has closed cannot be completed. Its
    // late answers were never saved, so marking it finished would record a
    // completion the Network should not count.
    const existing = await prisma.interview.findUnique({
      where: { id: interviewId },
      select: { expiresAt: true },
    });

    if (existing && isInterviewExpired(existing.expiresAt)) {
      return NextResponse.json(
        { error: 'Interview expired', expired: true },
        { status: 410 },
      );
    }

    const updatedInterview = await prisma.interview.update({
      where: { id: interviewId },
      data: { finishTime: new Date() },
      include: { participant: true },
    });

    const { label, identifier } = updatedInterview.participant;
    const participantDisplay = label ? `${label} (${identifier})` : identifier;

    const network = updatedInterview.network;

    void addEvent(
      'Interview Completed',
      `Participant "${participantDisplay}" completed an interview`,
      {
        kind: 'interviewCompleted',
        values: { participant: participantDisplay },
      },
      {
        nodeCount: network?.nodes?.length ?? 0,
        edgeCount: network?.edges?.length ?? 0,
      },
    );

    (await cookies()).set(updatedInterview.protocolId, 'completed');

    safeRevalidateTag(['getInterviews', 'summaryStatistics', 'activityFeed']);

    return NextResponse.json({ success: true });
  } catch (e) {
    const error = ensureError(e);

    after(async () => {
      await captureException(error, { context: 'interview.finish' });
      await flushPostHog();
    });

    return NextResponse.json(
      { error: 'Failed to finish interview' },
      { status: 500 },
    );
  }
}
