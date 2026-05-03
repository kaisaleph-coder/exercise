-- Schema outline for Workout Logger PWA
-- Codex should convert this into production migrations with indexes, triggers, RLS, and generated TypeScript types.

create type workout_status as enum ('planned','in_progress','completed','rest','sick','skipped','draft','deleted_import_row');
create type set_type as enum ('standard','myorep_activation','myorep_cluster','drop','partial','failure');
create type equipment_type as enum ('dumbbell','barbell','cable','machine','bodyweight','other');
create type progression_scope as enum ('global','program_block','exercise');
create type progression_mode as enum ('rep_first','double_progression','load_first','volume_first','set_first','custom');
create type device_session_status as enum ('active','idle','terminated','expired');
create type conflict_resolution as enum ('use_mobile','use_browser','manual_merge');

create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table user_preferences (
  user_id uuid primary key references user_profiles(id) on delete cascade,
  default_bodyweight_lb numeric default 150,
  unit_system text default 'imperial',
  persistent_timer_ribbon boolean default true,
  ui_density text default 'comfortable',
  button_size text default 'medium',
  font_scale numeric default 1.0,
  theme_mode text default 'system',
  accent_color text default 'default',
  default_progression_mode progression_mode default 'double_progression',
  default_rest_seconds integer default 90,
  auto_track_rest boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table bodyweight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles(id) on delete cascade,
  measured_at timestamptz not null,
  bodyweight_lb numeric not null,
  source text,
  note text,
  created_at timestamptz default now()
);

create table muscle_groups (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

create table exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles(id) on delete cascade,
  canonical_name text not null,
  primary_muscle_group_id uuid references muscle_groups(id),
  equipment equipment_type default 'other',
  is_unilateral boolean default false,
  is_bodyweight boolean default false,
  exclude_from_resistance_volume boolean default false,
  default_increment_lb numeric,
  default_low_rep_target integer,
  default_high_rep_target integer,
  default_set_count integer,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table exercise_aliases (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid references exercises(id) on delete cascade,
  alias text not null,
  confidence numeric,
  source text,
  needs_review boolean default false,
  created_at timestamptz default now()
);

create table programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles(id) on delete cascade,
  name text not null,
  description text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table program_blocks (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references programs(id) on delete cascade,
  name text not null,
  start_cycle integer,
  end_cycle integer,
  goal text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles(id) on delete cascade,
  program_id uuid references programs(id) on delete set null,
  cycle_number integer not null,
  start_date date,
  end_date date,
  status text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table workout_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles(id) on delete cascade,
  cycle_id uuid references cycles(id) on delete set null,
  day_number integer,
  scheduled_date date,
  completed_date date,
  status workout_status default 'planned',
  source_cycle_number integer,
  source_day_number integer,
  source_excel_date_serial numeric,
  session_started_at timestamptz,
  session_ended_at timestamptz,
  inferred_session_seconds integer,
  manual_session_seconds integer,
  location_tag text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_day_id uuid references workout_days(id) on delete cascade,
  exercise_id uuid references exercises(id) on delete set null,
  order_index integer,
  muscle_group_id uuid references muscle_groups(id),
  planned_sets integer,
  target_low_reps integer,
  target_high_reps integer,
  target_load_lb numeric,
  notes text,
  source_log_row integer,
  source_volume numeric,
  computed_resistance_volume numeric,
  computed_bodyweight_reps integer,
  started_at timestamptz,
  ended_at timestamptz,
  inferred_duration_seconds integer,
  manual_duration_seconds integer,
  completed boolean default false,
  collapsed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table set_logs (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid references workout_exercises(id) on delete cascade,
  set_index integer not null,
  reps integer,
  load_lb numeric,
  rir numeric,
  rpe numeric,
  set_type set_type default 'standard',
  is_completed boolean default false,
  is_to_failure boolean default false,
  has_partials boolean default false,
  is_drop_set boolean default false,
  is_myorep boolean default false,
  started_at timestamptz,
  ended_at timestamptz,
  set_duration_seconds integer,
  rest_after_seconds integer,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  raw_text text not null,
  created_at timestamptz default now()
);

create table note_tags (
  id uuid primary key default gen_random_uuid(),
  note_id uuid references notes(id) on delete cascade,
  tag_type text not null,
  tag_value text,
  confidence numeric,
  needs_review boolean default false
);

create table progression_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles(id) on delete cascade,
  scope_type progression_scope not null,
  scope_id uuid,
  name text not null,
  mode progression_mode not null,
  low_rep_target integer,
  high_rep_target integer,
  target_sets integer,
  increment_lb numeric,
  require_all_sets_at_top boolean default true,
  rir_ceiling numeric,
  allow_failure_sets boolean default true,
  deload_on_failed_progression boolean default true,
  deload_on_pain boolean default true,
  deload_on_low_adherence boolean default true,
  deload_load_reduction_percent numeric default 10,
  deload_set_reduction_count integer default 1,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table progression_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles(id) on delete cascade,
  workout_day_id uuid references workout_days(id) on delete set null,
  workout_exercise_id uuid references workout_exercises(id) on delete set null,
  exercise_id uuid references exercises(id) on delete set null,
  recommendation_date date default current_date,
  recommended_sets integer,
  recommended_low_reps integer,
  recommended_high_reps integer,
  recommended_load_lb numeric,
  rationale text,
  warning_level text,
  accepted_by_user boolean default false,
  log_only boolean default false,
  user_override_json jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table progression_log_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles(id) on delete cascade,
  recommendation_id uuid references progression_recommendations(id) on delete set null,
  cycle_id uuid references cycles(id) on delete set null,
  exercise_id uuid references exercises(id) on delete set null,
  event_type text not null,
  details_json jsonb,
  created_at timestamptz default now()
);

create table import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles(id) on delete cascade,
  file_name text,
  imported_at timestamptz default now(),
  status text,
  rows_seen integer,
  rows_imported integer,
  rows_rejected integer,
  warnings_count integer
);

create table import_source_rows (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid references import_batches(id) on delete cascade,
  sheet_name text,
  source_row_number integer,
  raw_values_json jsonb,
  raw_formulas_json jsonb,
  interpreted_type text,
  imported_entity_type text,
  imported_entity_id uuid,
  rejected boolean default false,
  rejection_reason text
);

create table import_warnings (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid references import_batches(id) on delete cascade,
  source_row_number integer,
  warning_type text,
  message text,
  severity text,
  resolved boolean default false,
  resolution_note text
);

create table import_review_decisions (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid references import_batches(id) on delete cascade,
  decision_type text,
  source_value text,
  chosen_value text,
  details_json jsonb,
  created_at timestamptz default now()
);

create table device_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles(id) on delete cascade,
  device_label text,
  device_type text,
  browser_fingerprint_hash text,
  last_seen_at timestamptz default now(),
  active_workout_day_id uuid references workout_days(id) on delete set null,
  status device_session_status default 'active',
  terminated_by_session_id uuid,
  terminated_at timestamptz,
  created_at timestamptz default now()
);

create table sync_conflicts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  mobile_version_json jsonb,
  browser_version_json jsonb,
  mobile_updated_at timestamptz,
  browser_updated_at timestamptz,
  resolution conflict_resolution,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

-- Codex: add indexes, updated_at triggers, RLS enablement, and RLS policies in final migrations.
