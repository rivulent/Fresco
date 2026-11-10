import { Effect, Layer, Queue } from "effect";
import { describe, expect, it, vi } from "vitest";

import { exportPipeline } from "@codaco/network-exporters/pipeline";
import { InterviewRepository } from "@codaco/network-exporters/services/InterviewRepository";
import { Output } from "@codaco/network-exporters/services/Output";
import { entityAttributesProperty, entityPrimaryKeyProperty } from "@codaco/shared-consts";
import { PrismaProtocolRepository } from "~/lib/export/ProtocolRepository";

vi.mock("~/lib/db", () => ({
  prisma: {
    protocol: {
      findMany: vi.fn(() =>
        Promise.resolve([
          {
            hash: "protocol-hash",
            name: "Baseline Social",
            codebook: {
              node: {
                person: {
                  name: "Person",
                  color: "node-color-seq-1",
                  shape: { default: "circle" },
                  variables: { "name-uuid": { type: "text", name: "name" } },
                },
              },
              edge: {
                friend: { name: "friend", color: "edge-color-seq-1" },
                conflict: {
                  name: "conflict",
                  color: "edge-color-seq-2",
                  variables: {
                    "severity-uuid": { type: "number", name: "severity" },
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

const person = (id: string) => ({
  [entityPrimaryKeyProperty]: id,
  type: "person",
  [entityAttributesProperty]: { "name-uuid": id },
});

const friendEdge = {
  [entityPrimaryKeyProperty]: "edge-1",
  type: "friend",
  from: "a",
  to: "b",
  [entityAttributesProperty]: {},
};

const interview = (id: string, edges: (typeof friendEdge)[]) => ({
  id,
  participantIdentifier: id,
  startTime: new Date("2026-01-01T00:00:00Z"),
  finishTime: new Date("2026-01-01T01:00:00Z"),
  protocolHash: "protocol-hash",
  network: {
    ego: { [entityPrimaryKeyProperty]: "ego", [entityAttributesProperty]: {} },
    nodes: [person("a"), person("b")],
    edges,
  },
});

const InterviewStub = Layer.succeed(InterviewRepository, {
  getForExport: () =>
    Effect.succeed([
      // Reported a friendship but no conflict.
      interview("p1", [friendEdge]),
      // Reported no edges at all.
      interview("p2", []),
    ]),
});

function makeCapturingOutput(files: Map<string, string>) {
  return Layer.succeed(Output, {
    begin: () => Effect.succeed(null),
    writeEntry: (_handle, entry) =>
      Effect.promise(async () => {
        const decoder = new TextDecoder();
        let text = "";
        for await (const chunk of entry.data) {
          text += decoder.decode(chunk, { stream: true });
        }
        files.set(entry.name, text);
      }),
    end: () => Effect.succeed({}),
  });
}

describe("edge list exports", () => {
  it("writes an edge list for every edge type, even when no edges of that type exist", async () => {
    const files = new Map<string, string>();

    const program = Effect.gen(function* () {
      const queue = yield* Queue.unbounded();
      return yield* exportPipeline(
        ["p1", "p2"],
        {
          exportCSV: true,
          exportGraphML: false,
          globalOptions: {
            useScreenLayoutCoordinates: false,
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
          Layer.mergeAll(InterviewStub, PrismaProtocolRepository, makeCapturingOutput(files)),
        ),
      ),
    );

    expect(result.failedExports).toStrictEqual([]);

    const edgeLists = [...files.keys()].filter((name) => name.includes("edgeList"));
    expect(edgeLists.toSorted()).toStrictEqual([
      "p1_p1_edgeList_conflict.csv",
      "p1_p1_edgeList_friend.csv",
      "p2_p2_edgeList_conflict.csv",
      "p2_p2_edgeList_friend.csv",
    ]);

    const lines = (name: string) => (files.get(name) ?? "").trim().split(/\r?\n/);

    expect(lines("p1_p1_edgeList_friend.csv")).toHaveLength(2);

    // Empty files carry only the header row, with that edge type's columns.
    const emptyConflict = lines("p1_p1_edgeList_conflict.csv");
    expect(emptyConflict).toHaveLength(1);
    expect(emptyConflict[0]?.split(",")).toContain("severity");
    expect(lines("p2_p2_edgeList_conflict.csv")).toStrictEqual(emptyConflict);

    const emptyFriend = lines("p2_p2_edgeList_friend.csv");
    expect(emptyFriend).toHaveLength(1);
    expect(emptyFriend[0]?.split(",")).not.toContain("severity");
  });
});
