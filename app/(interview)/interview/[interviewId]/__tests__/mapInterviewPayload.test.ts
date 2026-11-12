import { describe, expect, it } from 'vitest';

import { COMPATIBLE_PROTOCOL_SCHEMA_VERSION } from '@codaco/interview/protocol-schema-version';
import type { GetInterviewByIdQuery } from '~/queries/interviews';

import { mapInterviewPayload } from '../mapInterviewPayload';

/**
 * A minimal interview row shaped exactly as `getInterviewById` returns it
 * (JSON columns already parsed by the Prisma result extension), parameterised
 * by the protocol's persisted schema version.
 */
function makeSource(schemaVersion: number): NonNullable<GetInterviewByIdQuery> {
  return {
    id: 'interview-1',
    startTime: new Date('2026-01-01T00:00:00.000Z'),
    finishTime: null,
    exportTime: null,
    lastUpdated: new Date('2026-01-02T00:00:00.000Z'),
    network: {
      nodes: [],
      edges: [],
      ego: { _uid: 'ego-1', attributes: {} },
    },
    participantId: 'participant-1',
    protocolId: 'protocol-1',
    currentStep: 3,
    stageMetadata: null,
    isSynthetic: false,
    syncRevision: 7,
    pipedData: null,
    expiresAt: null,
    protocol: {
      id: 'protocol-1',
      hash: 'abc123',
      name: 'Test Protocol',
      schemaVersion,
      description: null,
      importedAt: new Date('2026-01-01T00:00:00.000Z'),
      stages: [],
      codebook: { node: {}, edge: {} },
      experiments: {},
      originalFileKey: null,
      originalFileUrl: null,
      assets: [],
    },
  };
}

describe('mapInterviewPayload', () => {
  it('stamps the payload with the protocol row’s own schema version', () => {
    const { payload, initialStep } = mapInterviewPayload(
      makeSource(COMPATIBLE_PROTOCOL_SCHEMA_VERSION),
    );

    expect(payload.protocol.schemaVersion).toBe(
      COMPATIBLE_PROTOCOL_SCHEMA_VERSION,
    );
    expect(payload.protocol.hash).toBe('abc123');
    expect(initialStep).toBe(3);
  });

  it('carries the row’s stored sync revision through, so writes are numbered from it', () => {
    // Numbering from zero instead would make every write a reloaded tab makes
    // older than what is stored, and the endpoint would discard all of them.
    const { initialSyncRevision } = mapInterviewPayload(
      makeSource(COMPATIBLE_PROTOCOL_SCHEMA_VERSION),
    );

    expect(initialSyncRevision).toBe(7);
  });

  it('injects the pipedData column into the session network for {{key}} substitution', () => {
    const { payload } = mapInterviewPayload({
      ...makeSource(COMPATIBLE_PROTOCOL_SCHEMA_VERSION),
      pipedData: { participantFirstName: 'Ada', visitNumber: 2 },
    });

    expect(payload.session.network).toMatchObject({
      nodes: [],
      edges: [],
      pipedData: { participantFirstName: 'Ada', visitNumber: 2 },
    });
  });

  it('leaves the network without pipedData when the column is empty', () => {
    const { payload } = mapInterviewPayload(
      makeSource(COMPATIBLE_PROTOCOL_SCHEMA_VERSION),
    );

    expect(payload.session.network).not.toHaveProperty('pipedData');
  });

  it('exposes a piped value as the matching ego variable so skip logic can read it', () => {
    const source = makeSource(COMPATIBLE_PROTOCOL_SCHEMA_VERSION);
    const { payload } = mapInterviewPayload({
      ...source,
      pipedData: { B1_AUDIT: '8', participantFirstName: 'Ada' },
      protocol: {
        ...source.protocol,
        codebook: {
          node: {},
          edge: {},
          ego: { variables: { 'var-audit': { name: 'B1_AUDIT', type: 'number' } } },
        },
      },
    });

    expect(payload.session.network.ego.attributes).toEqual({ 'var-audit': 8 });
    expect(payload.session.network).toMatchObject({
      pipedData: { B1_AUDIT: '8', participantFirstName: 'Ada' },
    });
  });

  it('refuses a protocol row stored below the compatible version rather than mislabelling it', () => {
    const staleVersion = COMPATIBLE_PROTOCOL_SCHEMA_VERSION - 1;

    expect(() => mapInterviewPayload(makeSource(staleVersion))).toThrow(
      new RegExp(
        `Test Protocol.+protocol-1.+${staleVersion}.+${COMPATIBLE_PROTOCOL_SCHEMA_VERSION}`,
        's',
      ),
    );
  });

  it('refuses a protocol row stored above the compatible version', () => {
    expect(() =>
      mapInterviewPayload(makeSource(COMPATIBLE_PROTOCOL_SCHEMA_VERSION + 1)),
    ).toThrow(/must be migrated/);
  });
});
