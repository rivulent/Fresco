import { describe, expect, it } from 'vitest';

import type { PipedData } from '~/schemas/interviews';
import { applyPipedEgoAttributes } from '~/app/(interview)/interview/[interviewId]/applyPipedEgoAttributes';

type Args = Parameters<typeof applyPipedEgoAttributes>;

const network = (attributes: Record<string, string | number | boolean> = {}) =>
  ({
    nodes: [],
    edges: [],
    ego: { _uid: 'ego-1', attributes },
  }) satisfies Args[0];

const codebook = {
  node: {
    person: {
      name: 'Person',
      color: 'node-color-seq-1',
      shape: { default: 'circle' },
      variables: {
        'node-audit': { name: 'B1_AUDIT', type: 'number' },
      },
    },
  },
  edge: {},
  ego: {
    variables: {
      'var-audit': { name: 'B1_AUDIT', type: 'number' },
      'var-label': { name: 'SITE', type: 'text' },
      'var-flag': { name: 'ENROLLED', type: 'boolean' },
      'var-ordinal': {
        name: 'VISIT',
        type: 'ordinal',
        options: [
          { label: 'One', value: 1 },
          { label: 'Two', value: 2 },
        ],
      },
    },
  },
} satisfies Args[2];

describe('applyPipedEgoAttributes', () => {
  it('writes a piped value into the ego variable with the same name', () => {
    const result = applyPipedEgoAttributes(
      network(),
      { B1_AUDIT: 8 },
      codebook,
    );

    expect(result.ego.attributes).toEqual({ 'var-audit': 8 });
  });

  it('never writes into a node variable that shares the name', () => {
    const result = applyPipedEgoAttributes(
      network(),
      { B1_AUDIT: 8 },
      codebook,
    );

    expect(result.ego.attributes).not.toHaveProperty('node-audit');
    expect(result.nodes).toEqual([]);
  });

  it('converts piped strings to the variable type', () => {
    const result = applyPipedEgoAttributes(
      network(),
      { B1_AUDIT: '12', SITE: 42, ENROLLED: 'TRUE', VISIT: '2' },
      codebook,
    );

    expect(result.ego.attributes).toEqual({
      'var-audit': 12,
      'var-label': '42',
      'var-flag': true,
      'var-ordinal': 2,
    });
  });

  it('leaves the attribute unset when the value is missing, null, or unconvertible', () => {
    // Skip logic reads an unset attribute as unanswered, so `B1_AUDIT > 0`
    // fails and the gated stages stay hidden, exactly as for a zero score.
    const unusable: PipedData[] = [
      {},
      { B1_AUDIT: null },
      { B1_AUDIT: '' },
      { B1_AUDIT: 'n/a' },
      { B1_AUDIT: true },
      { VISIT: '3' },
    ];
    for (const pipedData of unusable) {
      const input = network();
      expect(applyPipedEgoAttributes(input, pipedData, codebook)).toBe(input);
    }
  });

  it('overwrites a stored value so a corrected upstream score reaches a resumed interview', () => {
    const result = applyPipedEgoAttributes(
      network({ 'var-audit': 3, other: 'kept' }),
      { B1_AUDIT: 0 },
      codebook,
    );

    expect(result.ego.attributes).toEqual({ 'var-audit': 0, other: 'kept' });
  });

  it('ignores keys with no matching ego variable and protocols with no ego variables', () => {
    const input = network();

    expect(
      applyPipedEgoAttributes(input, { participantFirstName: 'Ada' }, codebook),
    ).toBe(input);
    expect(
      applyPipedEgoAttributes(input, { B1_AUDIT: 8 }, { node: {}, edge: {} }),
    ).toBe(input);
    expect(applyPipedEgoAttributes(input, null, codebook)).toBe(input);
  });
});
