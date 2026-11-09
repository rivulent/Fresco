import { Effect, Layer, Queue } from 'effect';
import { describe, expect, it, vi } from 'vitest';

import { getInitialLayoutVariableKey } from '@codaco/interview/contract';
import { exportPipeline } from '@codaco/network-exporters/pipeline';
import { InterviewRepository } from '@codaco/network-exporters/services/InterviewRepository';
import { Output } from '@codaco/network-exporters/services/Output';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { PrismaProtocolRepository } from '~/lib/export/ProtocolRepository';

const LAYOUT_KEY = 'layout-uuid';

vi.mock('~/lib/db', () => ({
  prisma: {
    protocol: {
      findMany: vi.fn(() =>
        Promise.resolve([
          {
            hash: 'protocol-hash',
            name: 'Baseline Social',
            codebook: {
              node: {
                person: {
                  name: 'Person',
                  color: 'node-color-seq-1',
                  shape: { default: 'circle' },
                  variables: {
                    'layout-uuid': { type: 'layout', name: 'B2_POST_CLOSE' },
                    'name-uuid': { type: 'text', name: 'name' },
                  },
                },
              },
            },
          },
        ]),
      ),
    },
  },
}));

const InterviewStub = Layer.succeed(InterviewRepository, {
  getForExport: () =>
    Effect.succeed([
      {
        id: 'interview-1',
        participantIdentifier: 'p1',
        startTime: new Date('2026-01-01T00:00:00Z'),
        finishTime: new Date('2026-01-01T01:00:00Z'),
        protocolHash: 'protocol-hash',
        network: {
          ego: {
            [entityPrimaryKeyProperty]: 'ego',
            [entityAttributesProperty]: {},
          },
          edges: [],
          nodes: [
            {
              [entityPrimaryKeyProperty]: 'node-1',
              type: 'person',
              [entityAttributesProperty]: {
                'name-uuid': 'Alex',
                [LAYOUT_KEY]: { x: 0.75, y: 0.25 },
                [getInitialLayoutVariableKey(LAYOUT_KEY)]: { x: 0.5, y: 0.5 },
              },
            },
          ],
        },
      },
    ]),
});

function makeCapturingOutput(files: Map<string, string>) {
  return Layer.succeed(Output, {
    begin: () => Effect.succeed(null),
    writeEntry: (_handle, entry) =>
      Effect.promise(async () => {
        const decoder = new TextDecoder();
        let text = '';
        for await (const chunk of entry.data) {
          text += decoder.decode(chunk, { stream: true });
        }
        files.set(entry.name, text);
      }),
    end: () => Effect.succeed({}),
  });
}

describe('initial sociogram placement in exports', () => {
  it('exports <name>_initial_x/_y and screen-space columns beside the current position', async () => {
    const files = new Map<string, string>();

    const program = Effect.gen(function* () {
      const queue = yield* Queue.unbounded();
      return yield* exportPipeline(
        ['interview-1'],
        {
          exportCSV: true,
          exportGraphML: false,
          globalOptions: {
            useScreenLayoutCoordinates: true,
            screenLayoutWidth: 1920,
            screenLayoutHeight: 1080,
          },
        },
        queue,
      );
    });

    const result = await Effect.runPromise(
      program.pipe(
        Effect.provide(
          Layer.mergeAll(
            InterviewStub,
            PrismaProtocolRepository,
            makeCapturingOutput(files),
          ),
        ),
      ),
    );

    expect(result.failedExports).toStrictEqual([]);

    const attributeList = [...files.entries()].find(([name]) =>
      name.includes('attributeList'),
    )?.[1];
    expect(attributeList).toBeDefined();

    const [headerLine = '', rowLine = ''] = (attributeList ?? '')
      .trim()
      .split(/\r?\n/);
    const headers = headerLine.split(',');
    const row = rowLine.split(',');
    const value = (column: string) => row[headers.indexOf(column)];

    expect(value('B2_POST_CLOSE_x')).toBe('0.75');
    expect(value('B2_POST_CLOSE_y')).toBe('0.25');
    expect(value('B2_POST_CLOSE_initial_x')).toBe('0.5');
    expect(value('B2_POST_CLOSE_initial_y')).toBe('0.5');
    expect(value('B2_POST_CLOSE_initial_screenSpaceX')).toBe('960.00');
    expect(value('B2_POST_CLOSE_initial_screenSpaceY')).toBe('540.00');
    // No raw-key column leaks out alongside the named ones.
    expect(
      headers.some(
        (header) => header.includes('_initial') && header.includes('uuid'),
      ),
    ).toBe(false);
  });
});
