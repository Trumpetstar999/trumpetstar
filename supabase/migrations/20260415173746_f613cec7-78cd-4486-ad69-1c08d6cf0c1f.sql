
-- Remove duplicate video stars: keep only the FIRST star per user+video+day
DELETE FROM video_completions
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY user_id, video_id, DATE(completed_at)
        ORDER BY completed_at ASC
      ) as rn
    FROM video_completions
    WHERE video_id IS NOT NULL
  ) ranked
  WHERE rn > 1
);
