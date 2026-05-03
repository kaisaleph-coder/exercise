-- Workout Logger PWA initial Supabase schema.
-- Run this in Supabase SQL Editor after creating the project.

create extension if not exists pgcrypto;

create type workout_status as enum ('planned','in_progress','completed','rest','sick','skipped','draft','deleted_import_row');
create type set_type as enum ('standard','myorep_activation','myorep_cluster','drop','partial','failure');
create type equipment_type as enum ('dumbbell','barbell','cable','machine','bodyweight','other');
create type progression_scope as enum ('global','program_block','exercise');
create type progression_mode as enum ('rep_first','double_progression','load_first','volume_first','set_first','custom');
create type device_session_status as enum ('active','idle','terminated','expired');
create type conflict_resolution as enum ('use_mobile','use_browser','manual_merge');

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_preferences (
  user_id uuid primary key references user_profiles(id) on delete cascade,
  default_bodyweight_lb numeric not null default 150,
  unit_system text not null default 'imperial',
  persistent_timer_ribbon boolean not null default true,
  ui_density text not null default 'comfortable',
  button_size text not null default 'medium',
  font_scale numeric not null default 1.0,
  theme_mode text not null default 'system',
  accent_color text not null default '#0f9f8a',
  button_layout text not null default 'balanced',
  default_progression_mode progression_mode not null default 'double_progression',
  default_rest_seconds integer not null default 90,
  auto_track_rest boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table bodyweight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  measured_at timestamptz not null,
  bodyweight_lb numeric not null,
  source text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table muscle_groups (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  sort_order integer not null
);

create table exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  canonical_name text not null,
  primary_muscle_group_id uuid not null references muscle_groups(id),
  equipment equipment_type not null default 'other',
  is_unilateral boolean not null default false,
  is_bodyweight boolean not null default false,
  exclude_from_resistance_volume boolean not null default false,
  default_increment_lb numeric not null default 2.5,
  default_low_rep_target integer,
  default_high_rep_target integer,
  default_set_count integer,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, canonical_name)
);

create table exercise_aliases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  alias text not null,
  confidence numeric,
  source text,
  needs_review boolean not null default false,
  created_at timestamptz not null default now(),
  unique(user_id, alias)
);

create table programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table program_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  program_id uuid not null references programs(id) on delete cascade,
  name text not null,
  start_cycle integer,
  end_cycle integer,
  goal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  program_id uuid references programs(id) on delete set null,
  cycle_number integer not null,
  start_date date,
  end_date date,
  status text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, cycle_number)
);

create table workout_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  cycle_id uuid references cycles(id) on delete set null,
  day_number integer,
  scheduled_date date,
  completed_date date,
  status workout_status not null default 'planned',
  source_cycle_number integer,
  source_day_number integer,
  source_excel_date_serial numeric,
  session_started_at timestamptz,
  session_ended_at timestamptz,
  inferred_session_seconds integer,
  manual_session_seconds integer,
  location_tag text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table workout_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  workout_day_id uuid not null references workout_days(id) on delete cascade,
  exercise_id uuid references exercises(id) on delete set null,
  order_index integer not null default 0,
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
  completed boolean not null default false,
  collapsed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table set_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  workout_exercise_id uuid not null references workout_exercises(id) on delete cascade,
  set_index integer not null,
  reps integer,
  load_lb numeric,
  rir numeric,
  rpe numeric,
  set_type set_type not null default 'standard',
  is_completed boolean not null default false,
  is_to_failure boolean not null default false,
  has_partials boolean not null default false,
  is_drop_set boolean not null default false,
  is_myorep boolean not null default false,
  started_at timestamptz,
  ended_at timestamptz,
  set_duration_seconds integer,
  rest_after_seconds integer,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type note_tag_type as enum ('location','equipment','pain','injury','form','failure','myorep','drop_set','partial','cable_machine','home','gym','adherence');

create table notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  raw_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table note_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  note_id uuid not null references notes(id) on delete cascade,
  tag_type note_tag_type not null,
  tag_value text,
  confidence numeric,
  needs_review boolean not null default false,
  created_at timestamptz not null default now()
);

create table progression_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  scope_type progression_scope not null,
  scope_id uuid,
  name text not null,
  mode progression_mode not null,
  low_rep_target integer,
  high_rep_target integer,
  target_sets integer,
  increment_lb numeric,
  require_all_sets_at_top boolean not null default true,
  rir_ceiling numeric,
  allow_failure_sets boolean not null default true,
  deload_on_failed_progression boolean not null default true,
  deload_on_pain boolean not null default true,
  deload_on_low_adherence boolean not null default true,
  deload_load_reduction_percent numeric not null default 10,
  deload_set_reduction_count integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table progression_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  workout_day_id uuid references workout_days(id) on delete set null,
  workout_exercise_id uuid references workout_exercises(id) on delete set null,
  exercise_id uuid references exercises(id) on delete set null,
  recommendation_date date not null default current_date,
  recommended_sets integer,
  recommended_low_reps integer,
  recommended_high_reps integer,
  recommended_load_lb numeric,
  progression_mode progression_mode not null default 'double_progression',
  rationale text,
  warning_level text,
  fallback_if_missed text,
  accepted_by_user boolean not null default false,
  log_only boolean not null default false,
  user_override_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table progression_log_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  recommendation_id uuid references progression_recommendations(id) on delete set null,
  cycle_id uuid references cycles(id) on delete set null,
  exercise_id uuid references exercises(id) on delete set null,
  event_type text not null,
  details_json jsonb,
  used_in_analytics boolean not null default true,
  created_at timestamptz not null default now()
);

create type import_warning_type as enum ('missing_date','date_serial_zero','unknown_exercise_alias','unknown_muscle_group','volume_mismatch','formula_mismatch','uncertain_unilateral','bodyweight_volume_excluded','note_tag_uncertain','template_row_ignored');

create table import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  file_name text,
  imported_at timestamptz not null default now(),
  status text not null default 'review_required',
  rows_seen integer not null default 0,
  rows_imported integer not null default 0,
  rows_rejected integer not null default 0,
  warnings_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table import_source_rows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  import_batch_id uuid not null references import_batches(id) on delete cascade,
  sheet_name text not null,
  source_row_number integer not null,
  raw_values_json jsonb not null,
  raw_formulas_json jsonb,
  interpreted_type text,
  imported_entity_type text,
  imported_entity_id uuid,
  source_volume numeric,
  computed_volume numeric,
  rejected boolean not null default false,
  rejection_reason text,
  created_at timestamptz not null default now()
);

create table import_warnings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  import_batch_id uuid not null references import_batches(id) on delete cascade,
  source_row_number integer,
  warning_type import_warning_type not null,
  message text not null,
  severity text not null,
  resolved boolean not null default false,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table import_review_decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  import_batch_id uuid not null references import_batches(id) on delete cascade,
  decision_type text not null,
  source_value text,
  chosen_value text,
  details_json jsonb,
  created_at timestamptz not null default now()
);

create table device_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  device_label text,
  device_type text not null default 'unknown',
  browser_fingerprint_hash text,
  last_seen_at timestamptz not null default now(),
  active_workout_day_id uuid references workout_days(id) on delete set null,
  status device_session_status not null default 'active',
  terminated_by_session_id uuid,
  terminated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table sync_conflicts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  mobile_version_json jsonb,
  browser_version_json jsonb,
  mobile_updated_at timestamptz,
  browser_updated_at timestamptz,
  resolution conflict_resolution,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into muscle_groups (name, sort_order)
values
  ('Chest', 1),
  ('Back', 2),
  ('Shoulders', 3),
  ('Biceps', 4),
  ('Triceps', 5),
  ('Core', 6),
  ('Legs', 7)
on conflict (name) do nothing;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'user_profiles','user_preferences','bodyweight_logs','exercises','exercise_aliases','programs','program_blocks','cycles',
    'workout_days','workout_exercises','set_logs','notes','note_tags','progression_rules','progression_recommendations',
    'import_batches','import_warnings','device_sessions','sync_conflicts'
  ]
  loop
    execute format('create trigger %I_set_updated_at before update on %I for each row execute function set_updated_at()', table_name, table_name);
  end loop;
end;
$$;

create index idx_exercises_user_group on exercises(user_id, primary_muscle_group_id);
create index idx_workout_days_user_date on workout_days(user_id, scheduled_date);
create index idx_workout_exercises_day_order on workout_exercises(workout_day_id, order_index);
create index idx_set_logs_exercise_order on set_logs(workout_exercise_id, set_index);
create index idx_import_warnings_batch_type on import_warnings(import_batch_id, warning_type, resolved);
create index idx_device_sessions_user_status on device_sessions(user_id, status, active_workout_day_id);
create index idx_sync_conflicts_user_unresolved on sync_conflicts(user_id, resolved_at) where resolved_at is null;

alter table muscle_groups enable row level security;
create policy "Anyone can read canonical muscle groups" on muscle_groups for select using (true);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'bodyweight_logs','exercises','exercise_aliases','programs','program_blocks','cycles','workout_days','workout_exercises',
    'set_logs','notes','note_tags','progression_rules','progression_recommendations','progression_log_entries',
    'import_batches','import_source_rows','import_warnings','import_review_decisions','device_sessions','sync_conflicts'
  ]
  loop
    execute format('alter table %I enable row level security', table_name);
    execute format('create policy %L on %I for select using (auth.uid() = user_id)', table_name || ' select own', table_name);
    execute format('create policy %L on %I for insert with check (auth.uid() = user_id)', table_name || ' insert own', table_name);
    execute format('create policy %L on %I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', table_name || ' update own', table_name);
    execute format('create policy %L on %I for delete using (auth.uid() = user_id)', table_name || ' delete own', table_name);
  end loop;
end;
$$;

alter table user_profiles enable row level security;
create policy "user_profiles select own" on user_profiles for select using (auth.uid() = id);
create policy "user_profiles insert own" on user_profiles for insert with check (auth.uid() = id);
create policy "user_profiles update own" on user_profiles for update using (auth.uid() = id) with check (auth.uid() = id);

alter table user_preferences enable row level security;
create policy "user_preferences select own" on user_preferences for select using (auth.uid() = user_id);
create policy "user_preferences insert own" on user_preferences for insert with check (auth.uid() = user_id);
create policy "user_preferences update own" on user_preferences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
