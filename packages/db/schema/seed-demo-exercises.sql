-- Optional demo exercise seed. Replace :user_id with your Supabase Auth user id before running.
insert into exercises (
  user_id,
  canonical_name,
  primary_muscle_group_id,
  equipment,
  is_unilateral,
  is_bodyweight,
  exclude_from_resistance_volume,
  default_increment_lb,
  default_low_rep_target,
  default_high_rep_target,
  default_set_count
)
select
  :'user_id'::uuid,
  seed.name,
  mg.id,
  seed.equipment::equipment_type,
  seed.is_unilateral,
  seed.is_bodyweight,
  seed.is_bodyweight,
  seed.increment,
  seed.low_rep,
  seed.high_rep,
  seed.sets
from (
  values
    ('Incline DB Press', 'Chest', 'dumbbell', false, false, 2.5, 8, 12, 3),
    ('Pushups', 'Chest', 'bodyweight', false, true, 0, 15, 25, 3),
    ('Incline DB Curl', 'Biceps', 'dumbbell', false, false, 2.5, 10, 14, 4),
    ('Bayesian Cable Curl', 'Biceps', 'cable', true, false, 2.5, 10, 15, 3),
    ('Bulgarian Split Squat', 'Legs', 'dumbbell', true, false, 2.5, 8, 12, 3)
) as seed(name, muscle_group, equipment, is_unilateral, is_bodyweight, increment, low_rep, high_rep, sets)
join muscle_groups mg on mg.name = seed.muscle_group
on conflict(user_id, canonical_name) do nothing;
