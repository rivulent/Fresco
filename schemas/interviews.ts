import { z } from 'zod';

import { type Participant, type Protocol } from '~/lib/db/generated/client';

/**
 * Piped-in data for {{key}} text substitution in prompts, form labels and
 * information screens (implemented in the vendored @codaco/interview fork).
 *
 * Written by the Network into the `Interview.pipedData` column when it creates
 * an interview, and injected into `session.network.pipedData` when the
 * interview loads — the only place the interview engine reads it from.
 */
export const PipedDataSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.null()]),
);

export type PipedData = z.infer<typeof PipedDataSchema>;

export type DeleteInterviews = {
  id: string;
}[];

export type CreateInterview = {
  participantIdentifier?: Participant['identifier'];
  protocolId: Protocol['id'];
};

/**
 * Why a new interview could not be created. These are outcomes the caller is
 * expected to route on, so they are a closed set of stable identifiers — never
 * a raw error message, which would leak internal detail across the server
 * action boundary and cannot be branched on reliably.
 *
 * `no-protocol` covers an onboarding link whose protocol no longer exists
 * (deleted, or simply mistyped). That is a routine participant-facing outcome
 * rather than a fault in the deployment.
 */
export type CreateInterviewErrorType =
  | 'incompatible-protocol'
  | 'invalid-identifier'
  | 'no-anonymous-recruitment'
  | 'no-protocol'
  | 'unknown';

export type CreateInterviewResult =
  | {
      errorType: null;
      error: null;
      createdInterviewId: string;
    }
  | {
      errorType: CreateInterviewErrorType;
      error: string;
      createdInterviewId: null;
    };
