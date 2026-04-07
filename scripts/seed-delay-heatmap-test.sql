-- Seed logging delay test data: update created_at for specific users
-- so that (created_at::date - date) varies across 0–10 days.
--
-- Strategy: assign each user a different base delay range so the heatmap
-- shows a full green-to-red spectrum. Add weekday-based variation
-- (Friday/Saturday logs tend to be delayed more).

BEGIN;

-- User 1-3: prompt loggers (0–1 day base delay)
UPDATE time_log
SET created_at = date + make_interval(
  days := FLOOR(RANDOM() * 2)::int,
  hours := FLOOR(RANDOM() * 12 + 8)::int,
  mins  := FLOOR(RANDOM() * 60)::int
)
WHERE user_id IN (
  'fe75742b-5544-494c-9a4c-14426d6d7364',
  'eb31bb4e-a173-49bd-97fa-e215f1f960c2',
  '740e07f2-349a-4cd2-a593-68a82d9409a6'
);

-- User 4-5: decent loggers (1–3 day base), Fridays delayed more (+2)
UPDATE time_log
SET created_at = date + make_interval(
  days := FLOOR(RANDOM() * 3 + 1)::int
       + CASE WHEN EXTRACT(DOW FROM date) IN (5, 6) THEN 2 ELSE 0 END,
  hours := FLOOR(RANDOM() * 12 + 8)::int,
  mins  := FLOOR(RANDOM() * 60)::int
)
WHERE user_id IN (
  '689e98cb-c02a-411d-873f-3b0460e9f6d5',
  'da143d73-314f-4dfb-8a0c-fe38e2e28b7c'
);

-- User 6-7: concerning loggers (3–6 day base)
UPDATE time_log
SET created_at = date + make_interval(
  days := FLOOR(RANDOM() * 4 + 3)::int
       + CASE WHEN EXTRACT(DOW FROM date) IN (5, 6) THEN 2 ELSE 0 END,
  hours := FLOOR(RANDOM() * 12 + 8)::int,
  mins  := FLOOR(RANDOM() * 60)::int
)
WHERE user_id IN (
  '15f63d2e-d3dc-4864-ac45-3cb70624d684',
  'a321757f-954b-4f03-8d1a-4cc1041f85de'
);

-- User 8-9: late loggers (6–10 day base)
UPDATE time_log
SET created_at = date + make_interval(
  days := FLOOR(RANDOM() * 5 + 6)::int,
  hours := FLOOR(RANDOM() * 12 + 8)::int,
  mins  := FLOOR(RANDOM() * 60)::int
)
WHERE user_id IN (
  'e7f97e00-4fe1-43c0-bd80-b82578178bb0',
  'd3275be9-fe5d-4ba1-a1d3-65c5bf6455eb'
);

COMMIT;

-- ============ VERIFICATION ============

-- 1. Per-user average delay (should show gradient across users)
SELECT
  u.name,
  ROUND(AVG(GREATEST((tl.created_at::date - tl.date)::int, 0)), 1) AS avg_delay,
  ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (
    ORDER BY GREATEST((tl.created_at::date - tl.date)::int, 0)
  )::numeric, 1) AS p75_delay,
  MIN(GREATEST((tl.created_at::date - tl.date)::int, 0)) AS min_delay,
  MAX(GREATEST((tl.created_at::date - tl.date)::int, 0)) AS max_delay,
  COUNT(*) AS entries
FROM time_log tl
JOIN "user" u ON u.id = tl.user_id
WHERE tl.user_id IN (
  'fe75742b-5544-494c-9a4c-14426d6d7364',
  'eb31bb4e-a173-49bd-97fa-e215f1f960c2',
  '740e07f2-349a-4cd2-a593-68a82d9409a6',
  '689e98cb-c02a-411d-873f-3b0460e9f6d5',
  'da143d73-314f-4dfb-8a0c-fe38e2e28b7c',
  '15f63d2e-d3dc-4864-ac45-3cb70624d684',
  'a321757f-954b-4f03-8d1a-4cc1041f85de',
  'e7f97e00-4fe1-43c0-bd80-b82578178bb0',
  'd3275be9-fe5d-4ba1-a1d3-65c5bf6455eb'
)
AND tl.status = 'active'
GROUP BY u.name
ORDER BY p75_delay;

-- 2. Preview what the heatmap endpoint would return (user × weekday P75)
SELECT
  u.name,
  ((EXTRACT(DOW FROM tl.date)::int + 6) % 7) AS weekday,
  ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (
    ORDER BY GREATEST((tl.created_at::date - tl.date)::int, 0)
  )::numeric, 1) AS p75_delay,
  COUNT(*) AS entries
FROM time_log tl
JOIN "user" u ON u.id = tl.user_id
WHERE tl.user_id IN (
  'fe75742b-5544-494c-9a4c-14426d6d7364',
  'eb31bb4e-a173-49bd-97fa-e215f1f960c2',
  '740e07f2-349a-4cd2-a593-68a82d9409a6',
  '689e98cb-c02a-411d-873f-3b0460e9f6d5',
  'da143d73-314f-4dfb-8a0c-fe38e2e28b7c',
  '15f63d2e-d3dc-4864-ac45-3cb70624d684',
  'a321757f-954b-4f03-8d1a-4cc1041f85de',
  'e7f97e00-4fe1-43c0-bd80-b82578178bb0',
  'd3275be9-fe5d-4ba1-a1d3-65c5bf6455eb'
)
AND tl.status = 'active'
GROUP BY u.name, ((EXTRACT(DOW FROM tl.date)::int + 6) % 7)
HAVING COUNT(*) >= 5
ORDER BY u.name, weekday;
