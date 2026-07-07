-- ── Workout Plans ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workout_plans (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own workout_plans" ON workout_plans
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Workout Exercises ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workout_exercises (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id      UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  sets         INTEGER NOT NULL DEFAULT 3,
  reps         INTEGER NOT NULL DEFAULT 10,
  rest_seconds INTEGER NOT NULL DEFAULT 60,
  bpm          INTEGER NOT NULL DEFAULT 60,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own workout_exercises" ON workout_exercises
  USING (
    EXISTS (
      SELECT 1 FROM workout_plans p
      WHERE p.id = workout_exercises.plan_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_plans p
      WHERE p.id = workout_exercises.plan_id
        AND p.user_id = auth.uid()
    )
  );
