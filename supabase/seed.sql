-- Local/dev seed data. Safe to re-run against a fresh database.
--
-- Journal prompts are real product content (not fictional placeholder
-- data), so this file is fine to apply in any environment, including a
-- first production deploy. Later phases will add clearly-marked fictional
-- sample books here, gated so they never reach production (see the
-- Phase 3/4 notes when those land).

insert into public.prompts (prompt_text, theme, status) values
  ('What are you carrying today that no one else can see?', 'presence', 'active'),
  ('Write about a moment you felt genuinely at ease this week.', 'rest', 'active'),
  ('What would you tell yourself from exactly one year ago?', 'growth', 'active'),
  ('Describe something small that brought you comfort recently.', 'gratitude', 'active'),
  ('What are you still learning to forgive yourself for?', 'self-forgiveness', 'active'),
  ('Who do you miss, and what would you want them to know?', 'relationships', 'active'),
  ('What does home feel like right now?', 'home', 'active'),
  ('Write about a change you saw coming but weren''t ready for.', 'change', 'active'),
  ('What is a fear you''re quietly carrying this season?', 'fear', 'active'),
  ('Describe a version of yourself you''re still becoming.', 'identity', 'active'),
  ('What is a goodbye you never got to finish?', 'grief', 'active'),
  ('What is something you did today that you''re proud of, even quietly?', 'pride', 'active'),
  ('Write about a friendship that ended without a clear ending.', 'relationships', 'active'),
  ('What would you say to someone who feels behind right now?', 'compassion', 'active'),
  ('What has your body been trying to tell you lately?', 'presence', 'active'),
  ('Describe a lesson you learned later than you wish you had.', 'growth', 'active'),
  ('What are you afraid to begin?', 'beginnings', 'active'),
  ('Write about a place that holds a memory you return to.', 'memory', 'active'),
  ('What small thing is keeping you going right now?', 'hope', 'active'),
  ('What do you wish someone had told you when things were hardest?', 'compassion', 'active'),
  ('Describe a moment of quiet courage from your week.', 'courage', 'active'),
  ('What does letting go actually look like for you?', 'change', 'active'),
  ('Write about someone who helped you without knowing it.', 'gratitude', 'active'),
  ('What question have you been avoiding asking yourself?', 'reflection', 'active');
