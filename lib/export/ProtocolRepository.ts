import { Effect, Layer } from 'effect';

import { withInitialLayoutVariables } from '@codaco/interview/contract';
import { DatabaseError } from '@codaco/network-exporters/errors';
import { type ProtocolExportInput } from '@codaco/network-exporters/input';
import { ProtocolRepository } from '@codaco/network-exporters/services/ProtocolRepository';
import { CodebookSchema } from '@codaco/protocol-validation';
import { prisma } from '~/lib/db';

export const PrismaProtocolRepository = Layer.succeed(ProtocolRepository, {
  getProtocols: (hashes) =>
    Effect.gen(function* () {
      const rows = yield* Effect.tryPromise({
        try: () =>
          prisma.protocol.findMany({
            where: { hash: { in: [...hashes] } },
          }),
        catch: (error) => new DatabaseError({ cause: error }),
      });

      const result: Record<string, ProtocolExportInput> = {};
      for (const row of rows) {
        result[row.hash] = {
          hash: row.hash,
          name: row.name,
          // The interview engine records each sociogram node's first placement
          // in a system-added companion of its layout variable. Describing
          // those companions here makes the exporter emit them as
          // `<name>_initial_x`/`_y` (and screen-space) columns.
          codebook: withInitialLayoutVariables(
            CodebookSchema.parse(row.codebook),
          ),
        };
      }
      return result;
    }),
});
