import {
  isValidAssetType,
  type InterviewPayload,
  type ResolvedAsset,
} from '@codaco/interview/contract';
import { COMPATIBLE_PROTOCOL_SCHEMA_VERSION } from '@codaco/interview/protocol-schema-version';
import type { GetInterviewByIdQuery } from '~/queries/interviews';
import type { PipedData } from '~/schemas/interviews';

export function mapInterviewPayload(
  source: NonNullable<GetInterviewByIdQuery>,
): {
  payload: InterviewPayload;
  assetUrls: Record<string, string>;
  initialStep: number;
  initialSyncRevision: number;
} {
  const { protocol, pipedData, ...session } = source;

  // The stored version is written from the validated document at import
  // (actions/protocols.ts) and rewritten by the deploy-time migration
  // (scripts/migrate-protocols.ts), so every row that reaches an interview
  // should already match the runtime. Stamping a literal instead would
  // mislabel any row that does not, handing the interview a document it cannot
  // read while claiming it can; refuse loudly instead.
  const { schemaVersion } = protocol;
  if (schemaVersion !== COMPATIBLE_PROTOCOL_SCHEMA_VERSION) {
    throw new Error(
      `Protocol "${protocol.name}" (id=${protocol.id}) is stored as schema ` +
        `version ${schemaVersion}, but this version of Fresco runs protocol ` +
        `schema version ${COMPATIBLE_PROTOCOL_SCHEMA_VERSION}. It must be ` +
        `migrated before an interview using it can be started.`,
    );
  }

  const assets: ResolvedAsset[] = protocol.assets.map((a) => {
    if (!isValidAssetType(a.type)) {
      throw new Error(`Unrecognised asset type from database: "${a.type}"`);
    }
    return {
      assetId: a.assetId,
      name: a.name,
      type: a.type,
      value: a.value ?? undefined,
    };
  });

  const assetUrls: Record<string, string> = {};
  for (const a of protocol.assets) {
    if (a.url) assetUrls[a.assetId] = a.url;
  }

  // Piped-text values live in their own column (see schema.prisma) so the sync
  // endpoint cannot drop them; the interview engine reads them from the network.
  const network: InterviewPayload['session']['network'] & {
    pipedData?: PipedData;
  } = pipedData ? { ...session.network, pipedData } : session.network;

  const payload: InterviewPayload = {
    session: {
      id: session.id,
      startTime: session.startTime.toISOString(),
      finishTime: session.finishTime?.toISOString() ?? null,
      exportTime: session.exportTime?.toISOString() ?? null,
      lastUpdated: session.lastUpdated.toISOString(),
      network,
      stageMetadata: session.stageMetadata ?? undefined,
    },
    protocol: {
      ...protocol,
      schemaVersion,
      hash: protocol.hash,
      description: protocol.description ?? undefined,
      importedAt: protocol.importedAt.toISOString(),
      assets,
    },
  };

  return {
    payload,
    assetUrls,
    initialStep: session.currentStep,
    // The sync handler numbers its writes upwards from here. It is not part of
    // `InterviewPayload` because it belongs to this host's transport rather
    // than to the interview the engine runs.
    initialSyncRevision: session.syncRevision,
  };
}
