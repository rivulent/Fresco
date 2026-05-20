-- ============================================================================
-- SQL to Pre-populate Interview Network - TEST SET 2
-- ============================================================================
-- A different set of T1 alters for testing with more nodes
-- ============================================================================

UPDATE "Interview"
SET network = '{
  "ego": {
    "_uid": "ego-test-participant-2",
    "attributes": {}
  },
  "nodes": [
    {
      "_uid": "t1-test2-001",
      "type": "f02f1f97-7b15-4c77-92b3-60dc9d175b9b",
      "promptIDs": [],
      "stageId": null,
      "attributes": {
        "5df16102-5fba-4f7a-9bef-31479abbf04e": "Maria",
        "80b10c44-7771-4ba6-94a1-04438776de1e": true,
        "290fe02a-fcd9-40f5-9b0d-112ec056cc6b": 201,
        "65261541-d7da-434e-8983-6dfde67f5634": "uuid-t2-maria-001",
        "96fe4402-a4ca-4660-85a1-b36116d2d732": 7001
      }
    },
    {
      "_uid": "t1-test2-002",
      "type": "f02f1f97-7b15-4c77-92b3-60dc9d175b9b",
      "promptIDs": [],
      "stageId": null,
      "attributes": {
        "5df16102-5fba-4f7a-9bef-31479abbf04e": "James",
        "80b10c44-7771-4ba6-94a1-04438776de1e": true,
        "290fe02a-fcd9-40f5-9b0d-112ec056cc6b": 202,
        "65261541-d7da-434e-8983-6dfde67f5634": "uuid-t2-james-002",
        "96fe4402-a4ca-4660-85a1-b36116d2d732": 7001
      }
    },
    {
      "_uid": "t1-test2-003",
      "type": "f02f1f97-7b15-4c77-92b3-60dc9d175b9b",
      "promptIDs": [],
      "stageId": null,
      "attributes": {
        "5df16102-5fba-4f7a-9bef-31479abbf04e": "Sophia",
        "80b10c44-7771-4ba6-94a1-04438776de1e": true,
        "290fe02a-fcd9-40f5-9b0d-112ec056cc6b": 203,
        "65261541-d7da-434e-8983-6dfde67f5634": "uuid-t2-sophia-003",
        "96fe4402-a4ca-4660-85a1-b36116d2d732": 7001
      }
    },
    {
      "_uid": "t1-test2-004",
      "type": "f02f1f97-7b15-4c77-92b3-60dc9d175b9b",
      "promptIDs": [],
      "stageId": null,
      "attributes": {
        "5df16102-5fba-4f7a-9bef-31479abbf04e": "David",
        "80b10c44-7771-4ba6-94a1-04438776de1e": true,
        "290fe02a-fcd9-40f5-9b0d-112ec056cc6b": 204,
        "65261541-d7da-434e-8983-6dfde67f5634": "uuid-t2-david-004",
        "96fe4402-a4ca-4660-85a1-b36116d2d732": 7001
      }
    },
    {
      "_uid": "t1-test2-005",
      "type": "f02f1f97-7b15-4c77-92b3-60dc9d175b9b",
      "promptIDs": [],
      "stageId": null,
      "attributes": {
        "5df16102-5fba-4f7a-9bef-31479abbf04e": "Emma",
        "80b10c44-7771-4ba6-94a1-04438776de1e": true,
        "290fe02a-fcd9-40f5-9b0d-112ec056cc6b": 205,
        "65261541-d7da-434e-8983-6dfde67f5634": "uuid-t2-emma-005",
        "96fe4402-a4ca-4660-85a1-b36116d2d732": 7001
      }
    },
    {
      "_uid": "t1-test2-006",
      "type": "f02f1f97-7b15-4c77-92b3-60dc9d175b9b",
      "promptIDs": [],
      "stageId": null,
      "attributes": {
        "5df16102-5fba-4f7a-9bef-31479abbf04e": "Michael",
        "80b10c44-7771-4ba6-94a1-04438776de1e": true,
        "290fe02a-fcd9-40f5-9b0d-112ec056cc6b": 206,
        "65261541-d7da-434e-8983-6dfde67f5634": "uuid-t2-michael-006",
        "96fe4402-a4ca-4660-85a1-b36116d2d732": 7001
      }
    },
    {
      "_uid": "t1-test2-007",
      "type": "f02f1f97-7b15-4c77-92b3-60dc9d175b9b",
      "promptIDs": [],
      "stageId": null,
      "attributes": {
        "5df16102-5fba-4f7a-9bef-31479abbf04e": "Olivia",
        "80b10c44-7771-4ba6-94a1-04438776de1e": true,
        "290fe02a-fcd9-40f5-9b0d-112ec056cc6b": 207,
        "65261541-d7da-434e-8983-6dfde67f5634": "uuid-t2-olivia-007",
        "96fe4402-a4ca-4660-85a1-b36116d2d732": 7001
      }
    },
    {
      "_uid": "t1-test2-008",
      "type": "f02f1f97-7b15-4c77-92b3-60dc9d175b9b",
      "promptIDs": [],
      "stageId": null,
      "attributes": {
        "5df16102-5fba-4f7a-9bef-31479abbf04e": "Daniel",
        "80b10c44-7771-4ba6-94a1-04438776de1e": true,
        "290fe02a-fcd9-40f5-9b0d-112ec056cc6b": 208,
        "65261541-d7da-434e-8983-6dfde67f5634": "uuid-t2-daniel-008",
        "96fe4402-a4ca-4660-85a1-b36116d2d732": 7001
      }
    }
  ],
  "edges": []
}'::jsonb
WHERE id = 'YOUR_INTERVIEW_ID_HERE';


-- ============================================================================
-- TEST SET 2 SUMMARY
-- ============================================================================
--
-- This test set includes 8 T1 alters (vs 3 in test set 1):
--
-- | Node ID | Name    | UUID                  |
-- |---------|---------|----------------------|
-- | 201     | Maria   | uuid-t2-maria-001    |
-- | 202     | James   | uuid-t2-james-002    |
-- | 203     | Sophia  | uuid-t2-sophia-003   |
-- | 204     | David   | uuid-t2-david-004    |
-- | 205     | Emma    | uuid-t2-emma-005     |
-- | 206     | Michael | uuid-t2-michael-006  |
-- | 207     | Olivia  | uuid-t2-olivia-007   |
-- | 208     | Daniel  | uuid-t2-daniel-008   |
--
-- All nodes use IRIS ID: 7001 (change as needed)
-- ============================================================================


-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- SELECT
--   id,
--   "participantId",
--   jsonb_array_length(network->'nodes') as node_count,
--   network->'nodes' as all_nodes
-- FROM "Interview"
-- WHERE id = 'YOUR_INTERVIEW_ID_HERE';
