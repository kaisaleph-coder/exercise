# Database Schema

The production Supabase schema starts in:

```text
packages/db/migrations/0001_initial_schema.sql
```

It includes:

1. Required enums.
2. User-owned tables with `user_id`.
3. Canonical muscle groups.
4. Import audit tables.
5. Progression recommendation and log tables.
6. Device session and sync conflict tables.
7. Row Level Security policies.

Run the migration in Supabase SQL Editor during setup.
