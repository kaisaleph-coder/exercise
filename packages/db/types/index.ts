export type WorkoutStatus = "planned" | "in_progress" | "completed" | "rest" | "sick" | "skipped" | "draft" | "deleted_import_row";
export type SetType = "standard" | "myorep_activation" | "myorep_cluster" | "drop" | "partial" | "failure";
export type EquipmentType = "dumbbell" | "barbell" | "cable" | "machine" | "bodyweight" | "other";
export type ProgressionScope = "global" | "program_block" | "exercise";
export type ProgressionMode = "rep_first" | "double_progression" | "load_first" | "volume_first" | "set_first" | "custom";
export type DeviceSessionStatus = "active" | "idle" | "terminated" | "expired";
export type ConflictResolution = "use_mobile" | "use_browser" | "manual_merge";
export type ImportWarningType =
  | "missing_date"
  | "date_serial_zero"
  | "unknown_exercise_alias"
  | "unknown_muscle_group"
  | "volume_mismatch"
  | "formula_mismatch"
  | "uncertain_unilateral"
  | "bodyweight_volume_excluded"
  | "note_tag_uncertain"
  | "template_row_ignored";
