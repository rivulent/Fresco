import { type Participant, type Protocol } from '~/lib/db/generated/client';
import { z } from 'zod';
import { type ZNcNetwork } from './network-canvas';

export type DeleteInterviews = {
  id: string;
}[];

export type CreateInterview = {
  participantIdentifier?: Participant['identifier'];
  protocolId: Protocol['id'];
};

// Piped-in data for text substitution in prompts/information screens
export type PipedData = Record<string, string | number | boolean | null>;

const NumberStringBoolean = z.union([z.number(), z.string(), z.boolean()]);
type NumberStringBoolean = z.infer<typeof NumberStringBoolean>;

export type SyncInterview = {
  id: string;
  network: z.infer<typeof ZNcNetwork>;
  currentStep: number;
  stageMetadata?: Record<string, NumberStringBoolean[][]>;
};
