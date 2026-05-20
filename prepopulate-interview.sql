-- ============================================================================
-- SQL to Pre-populate Interview Network with T1 Alters
-- ============================================================================
--
-- USAGE:
-- 1. Replace 'YOUR_INTERVIEW_ID_HERE' with the actual interview ID
-- 2. Modify the nodes array to include the participant's specific T1 alters
-- 3. Run this SQL after creating the interview but before the participant starts
--
-- IMPORTANT:
-- - Each node must have a unique "_uid" value
-- - Node "type" must be "f02f1f97-7b15-4c77-92b3-60dc9d175b9b" (your person type)
-- - The "80b10c44-7771-4ba6-94a1-04438776de1e" attribute (incnamest1) should be true
--   for T1 alters so they appear in the correct panel
-- ============================================================================

-- Single Interview Update
UPDATE "Interview"
SET network = '{
  "ego": {
    "_uid": "ego-participant-unique-id",
    "attributes": {}
  },
  "nodes": [
    {
      "_uid": "t1-node-001",
      "type": "f02f1f97-7b15-4c77-92b3-60dc9d175b9b",
      "promptIDs": [],
      "stageId": null,
      "attributes": {
        "5df16102-5fba-4f7a-9bef-31479abbf04e": "Alice",
        "80b10c44-7771-4ba6-94a1-04438776de1e": true,
        "290fe02a-fcd9-40f5-9b0d-112ec056cc6b": 101,
        "65261541-d7da-434e-8983-6dfde67f5634": "uuid-from-t1-alice",
        "96fe4402-a4ca-4660-85a1-b36116d2d732": 5001
      }
    },
    {
      "_uid": "t1-node-002",
      "type": "f02f1f97-7b15-4c77-92b3-60dc9d175b9b",
      "promptIDs": [],
      "stageId": null,
      "attributes": {
        "5df16102-5fba-4f7a-9bef-31479abbf04e": "Bob",
        "80b10c44-7771-4ba6-94a1-04438776de1e": true,
        "290fe02a-fcd9-40f5-9b0d-112ec056cc6b": 102,
        "65261541-d7da-434e-8983-6dfde67f5634": "uuid-from-t1-bob",
        "96fe4402-a4ca-4660-85a1-b36116d2d732": 5001
      }
    },
    {
      "_uid": "t1-node-003",
      "type": "f02f1f97-7b15-4c77-92b3-60dc9d175b9b",
      "promptIDs": [],
      "stageId": null,
      "attributes": {
        "5df16102-5fba-4f7a-9bef-31479abbf04e": "Carol",
        "80b10c44-7771-4ba6-94a1-04438776de1e": true,
        "290fe02a-fcd9-40f5-9b0d-112ec056cc6b": 103,
        "65261541-d7da-434e-8983-6dfde67f5634": "uuid-from-t1-carol",
        "96fe4402-a4ca-4660-85a1-b36116d2d732": 5001
      }
    }
  ],
  "edges": []
}'::jsonb
WHERE id = 'YOUR_INTERVIEW_ID_HERE';


-- ============================================================================
-- ATTRIBUTE REFERENCE (from your protocol codebook)
-- ============================================================================
--
-- Variable UUID                              | Name              | Description
-- -------------------------------------------|-------------------|---------------------------
-- 5df16102-5fba-4f7a-9bef-31479abbf04e       | name              | Person's name (text)
-- 80b10c44-7771-4ba6-94a1-04438776de1e       | incnamest1        | T1 flag (boolean) - SET TO true
-- 290fe02a-fcd9-40f5-9b0d-112ec056cc6b       | incnamest1node    | Node ID (number)
-- 65261541-d7da-434e-8983-6dfde67f5634       | incnamest1UUID    | UUID (text)
-- 96fe4402-a4ca-4660-85a1-b36116d2d732       | incnamest1IRISID  | Participant IRIS ID (number)
--
-- Node type UUID: f02f1f97-7b15-4c77-92b3-60dc9d175b9b
-- ============================================================================


-- ============================================================================
-- ALTERNATIVE: Parameterized Version for Scripting
-- ============================================================================
-- If you're generating this from a script, you can use this pattern:

-- For PostgreSQL with psql variables:
-- \set interview_id 'clxxxxxxxxxxxxxxxxx'
-- \set participant_name 'Alice'
-- \set node_id 101
-- \set node_uuid 'abc-123'
-- \set iris_id 5001

-- UPDATE "Interview"
-- SET network = jsonb_build_object(
--   'ego', jsonb_build_object('_uid', 'ego-' || :interview_id, 'attributes', '{}'::jsonb),
--   'nodes', jsonb_build_array(
--     jsonb_build_object(
--       '_uid', 't1-' || :node_id,
--       'type', 'f02f1f97-7b15-4c77-92b3-60dc9d175b9b',
--       'attributes', jsonb_build_object(
--         '5df16102-5fba-4f7a-9bef-31479abbf04e', :participant_name,
--         '80b10c44-7771-4ba6-94a1-04438776de1e', true,
--         '290fe02a-fcd9-40f5-9b0d-112ec056cc6b', :node_id,
--         '65261541-d7da-434e-8983-6dfde67f5634', :node_uuid,
--         '96fe4402-a4ca-4660-85a1-b36116d2d732', :iris_id
--       )
--     )
--   ),
--   'edges', '[]'::jsonb
-- )
-- WHERE id = :'interview_id';


-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this after the UPDATE to verify the data was inserted correctly:

-- SELECT
--   id,
--   "participantId",
--   jsonb_array_length(network->'nodes') as node_count,
--   network->'nodes'->0->'attributes'->>'5df16102-5fba-4f7a-9bef-31479abbf04e' as first_node_name
-- FROM "Interview"
-- WHERE id = 'YOUR_INTERVIEW_ID_HERE';
