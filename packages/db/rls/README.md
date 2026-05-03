# Row Level Security

Every user-owned table has policies that only allow the logged-in user to read, insert, update, or delete rows where:

```sql
auth.uid() = user_id
```

`user_profiles` uses:

```sql
auth.uid() = id
```

`muscle_groups` are canonical shared lookup rows and are readable by everyone.
