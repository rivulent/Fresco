import { type Participant, type Protocol } from '~/lib/db/generated/client';

/**
 * Piped-in data for text substitution in prompts/information screens.
 * Stored in interview.network.pipedData.
 *
 * NOTE: Text substitution using {{key}} syntax requires support in the
 * @codaco/interview package. Currently this data structure is passed through
 * but substitution is not yet implemented in the upstream package.
 */
export type PipedData = Record<string, string | number | boolean | null>;

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
