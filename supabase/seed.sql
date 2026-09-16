-- Fixed category list. Real product content, safe to apply in any
-- environment including a first production deploy. Categories are
-- managed exclusively via the service-role client (no public write
-- policy), so this file is the only place they're created — there is no
-- admin UI for adding/editing categories in this MVP.

insert into public.categories (slug, name, description, sort_order) values
  ('love-and-almost-love', 'Love and Almost Love',
   'Crushes, relationships, breakups, unrequited love, people you never confessed your feelings to.', 1),
  ('friendships-and-goodbyes', 'Friendships and Goodbyes',
   'Friendship breakups, drifting apart, betrayal, loneliness within friendships.', 2),
  ('family-and-home', 'Family and Home',
   'Parents, siblings, family expectations, complicated homes, things left unsaid to family.', 3),
  ('identity-and-belonging', 'Identity and Belonging',
   'Culture, sexuality, gender, insecurity, feeling different, hiding parts of yourself.', 4),
  ('regret-and-forgiveness', 'Regret and Forgiveness',
   'Mistakes, guilt, apologies never given, things you''re struggling to forgive.', 5),
  ('grief-and-missing-someone', 'Grief and Missing Someone',
   'Death, absence, losing a person, pet, place, relationship, or former version of life.', 6),
  ('growing-and-starting-over', 'Growing and Starting Over',
   'Change, college, moving, adulthood, leaving something behind, becoming someone new.', 7),
  ('dreams-and-roads-not-taken', 'Dreams and Roads Not Taken',
   'Abandoned dreams, secret ambitions, missed opportunities, alternate lives.', 8),
  ('pressure-and-feeling-behind', 'Pressure and Feeling Behind',
   'School, work, achievement, comparison, failure, uncertainty about the future.', 9),
  ('things-i-cannot-say-aloud', 'Things I Cannot Say Aloud',
   'Confessions that don''t fit elsewhere, private truths, secrets, difficult admissions.', 10),
  ('lessons-i-learned-too-late', 'Lessons I Learned Too Late',
   'Lived experiences, realizations, warnings, and advice earned through experience.', 11),
  ('hope-and-small-reasons-to-stay', 'Hope and Small Reasons to Stay',
   'Recovery, encouragement, unexpected joy, things that helped you keep going.', 12);
