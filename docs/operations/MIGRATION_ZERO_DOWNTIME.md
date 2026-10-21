# Migration zero-downtime policy

Expand/contract is required for Traqora backend schema changes so deploys
never take an exclusive lock that blocks bookings.

## Contract

| Input | Output | Error |
| --- | --- | --- |
| A TypeORM migration `up()` | Additive DDL only (`ADD COLUMN`, `CREATE TABLE`, `CREATE INDEX`) | CI fails when `up()` contains `DROP TABLE`, `DROP COLUMN`, `RENAME COLUMN`, `ALTER ... TYPE`, or `SET NOT NULL` |
| A rollback | Destructive DDL belongs in `down()`, never in the same `up()` as the expand | Operators restore via backup (see `docs/DEPLOYMENT_CHECKLIST.md`) if `down()` is unsafe on prod |

## Operator steps

1. Expand: ship the additive migration and a code path that writes both old and new columns.
2. Deploy app code that reads the new column with a fallback to the old one.
3. Contract (later PR): backfill, then drop the old column behind a `zero-downtime-exception:` comment if a drop is unavoidable.
4. Set `lock_timeout` / `statement_timeout` on the migration session so a blocked migrate fails fast instead of queueing behind live traffic.

```bash
npm run check:migrations
```

## Failure mode

A migration whose `up()` drops a column will fail `npm run check:migrations` and must be split into expand then contract PRs.
