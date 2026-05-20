-- ============================================================================
-- SQL to CREATE Interview with T1 Nodes Pre-populated into T2 Protocol
-- ============================================================================
-- Source: T1 protocol (cip* variables)
-- Destination: T2 protocol (iip* variables)
--
-- Mapping notes:
-- - "name" shares same UUID in both protocols
-- - Destination has incnamest1* fields for tracking T1 imports
-- - Most cip* attributes don't transfer (different UUIDs in destination)
-- ============================================================================

WITH config AS (
  SELECT
    'cmoj18zhg000009jyo3g9627x' AS protocol_id,
    'test-participant-002' AS participant_id,
    'Test Participant T2' AS participant_label
),

participant_insert AS (
  INSERT INTO "Participant" (id, identifier, label)
  SELECT
    'part-' || substr(md5(random()::text), 1, 24),
    config.participant_id,
    config.participant_label
  FROM config
  ON CONFLICT (identifier) DO NOTHING
  RETURNING id, identifier
),

participant AS (
  SELECT id, identifier FROM participant_insert
  UNION ALL
  SELECT p.id, p.identifier FROM "Participant" p, config
  WHERE p.identifier = config.participant_id
  LIMIT 1
)

INSERT INTO "Interview" (
  id,
  "startTime",
  "lastUpdated",
  "finishTime",
  "exportTime",
  network,
  "protocolId",
  "participantId",
  "currentStep",
  "stageMetadata"
)
SELECT
  'int-' || substr(md5(random()::text), 1, 24),
  NOW(),
  NOW(),
  NULL,
  NULL,
  '{
    "ego": {
      "_uid": "ego-t2-interview",
      "attributes": {}
    },
    "nodes": [
      {
        "_uid": "t2-node-001",
        "type": "f02f1f97-7b15-4c77-92b3-60dc9d175b9b",
        "promptIDs": [],
        "stageId": null,
        "attributes": {
          "5df16102-5fba-4f7a-9bef-31479abbf04e": "anytime1",
          "80b10c44-7771-4ba6-94a1-04438776de1e": true,
          "290fe02a-fcd9-40f5-9b0d-112ec056cc6b": 1,
          "65261541-d7da-434e-8983-6dfde67f5634": "5790a1d3-90d9-4b35-86e0-3238e312a167",
          "96fe4402-a4ca-4660-85a1-b36116d2d732": 9999
        }
      },
      {
        "_uid": "t2-node-002",
        "type": "f02f1f97-7b15-4c77-92b3-60dc9d175b9b",
        "promptIDs": [],
        "stageId": null,
        "attributes": {
          "5df16102-5fba-4f7a-9bef-31479abbf04e": "anytime2",
          "80b10c44-7771-4ba6-94a1-04438776de1e": true,
          "290fe02a-fcd9-40f5-9b0d-112ec056cc6b": 2,
          "65261541-d7da-434e-8983-6dfde67f5634": "1139d2ad-c2f8-45de-aad2-37f8c72fc63d",
          "96fe4402-a4ca-4660-85a1-b36116d2d732": 9999
        }
      },
      {
        "_uid": "t2-node-003",
        "type": "f02f1f97-7b15-4c77-92b3-60dc9d175b9b",
        "promptIDs": [],
        "stageId": null,
        "attributes": {
          "5df16102-5fba-4f7a-9bef-31479abbf04e": "anytime3",
          "80b10c44-7771-4ba6-94a1-04438776de1e": true,
          "290fe02a-fcd9-40f5-9b0d-112ec056cc6b": 3,
          "65261541-d7da-434e-8983-6dfde67f5634": "4e0542da-8a63-4a44-ae41-7120925814f6",
          "96fe4402-a4ca-4660-85a1-b36116d2d732": 9999
        }
      },
      {
        "_uid": "t2-node-004",
        "type": "f02f1f97-7b15-4c77-92b3-60dc9d175b9b",
        "promptIDs": [],
        "stageId": null,
        "attributes": {
          "5df16102-5fba-4f7a-9bef-31479abbf04e": "anytime4",
          "80b10c44-7771-4ba6-94a1-04438776de1e": true,
          "290fe02a-fcd9-40f5-9b0d-112ec056cc6b": 4,
          "65261541-d7da-434e-8983-6dfde67f5634": "cb0b047c-a9f0-4bae-98d1-d91cc80fb944",
          "96fe4402-a4ca-4660-85a1-b36116d2d732": 9999
        }
      },
      {
        "_uid": "t2-node-005",
        "type": "f02f1f97-7b15-4c77-92b3-60dc9d175b9b",
        "promptIDs": [],
        "stageId": null,
        "attributes": {
          "5df16102-5fba-4f7a-9bef-31479abbf04e": "incident-1",
          "80b10c44-7771-4ba6-94a1-04438776de1e": true,
          "290fe02a-fcd9-40f5-9b0d-112ec056cc6b": 5,
          "65261541-d7da-434e-8983-6dfde67f5634": "6bffde32-93bf-4b1b-8c47-98f981d43b29",
          "96fe4402-a4ca-4660-85a1-b36116d2d732": 9999
        }
      }
    ],
    "edges": []
  }'::jsonb,
  config.protocol_id,
  participant.id,
  0,
  '{}'::jsonb
FROM config, participant
RETURNING id;

-- ============================================================================
-- ATTRIBUTE MAPPING REFERENCE
-- ============================================================================
--
-- SHARED UUID (works in both protocols):
--   5df16102-5fba-4f7a-9bef-31479abbf04e = "name" (text)
--
-- DESTINATION-ONLY (T2 import tracking fields):
--   80b10c44-7771-4ba6-94a1-04438776de1e = "incnamest1" (boolean) - set TRUE
--   290fe02a-fcd9-40f5-9b0d-112ec056cc6b = "incnamest1node" (number) - node sequence
--   65261541-d7da-434e-8983-6dfde67f5634 = "incnamest1UUID" (text) - original T1 _uid
--   96fe4402-a4ca-4660-85a1-b36116d2d732 = "incnamest1IRISID" (number) - participant ID
--
-- SOURCE ATTRIBUTES NOT TRANSFERRED (different UUIDs in destination):
--   cipdem1, cipdem2, cipdem3, cipdem4, cipdem5, cipdem6, cipdem7
--   cipsg2b, cipsg2c, cipsg2f, cipcon2, cnameperp
--
-- ============================================================================
