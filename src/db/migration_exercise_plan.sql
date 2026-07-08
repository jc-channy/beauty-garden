-- ── Exercise Plan Items ─────────────────────────────────────────────────────
-- Stores the user's weekly exercise plan.
-- Each row = one exercise type scheduled for a given day_of_week (0=Sun…6=Sat).
-- frequency: 'weekly' | 'biweekly'
-- Biweekly items show only on ISO-week-odd weeks (A weeks).

CREATE TABLE IF NOT EXISTS exercise_plan_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week    INTEGER NOT NULL,          -- 0 = Sun, 1 = Mon, … 6 = Sat
  exercise_type  TEXT NOT NULL,
  target_minutes INTEGER NOT NULL DEFAULT 30,
  frequency      TEXT NOT NULL DEFAULT 'weekly',  -- 'weekly' | 'biweekly'
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE exercise_plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own exercise plan items"
  ON exercise_plan_items
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
