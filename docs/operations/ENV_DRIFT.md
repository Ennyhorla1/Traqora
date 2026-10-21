# Backend env drift check

Compares a running (or candidate) backend env against `env.example` so
staging/production cannot silently drop a required secret or pick up an
undocumented variable.

## Contract

| Input | Output | Error |
| --- | --- | --- |
| `env.example` + `--env` file | JSON `{ ok, missing, undocumented }` | Exit 1 when a declared backend variable has no value and no example default |
| `env.example` only | Parses declared keys (CI-safe; no secrets required) | Exit 1 only if no backend keys are declared |

```bash
npm run check:env-drift -- --env .env
```

Commented `# OPTIONAL=` keys in `env.example` are optional. `NEXT_PUBLIC_*` keys are client-side and ignored.

## Failure mode

Omitting `JWT_SECRET` (declared with an empty default) fails the check. An extra `STRAY_BACKEND_FLAG` in the env file is reported as undocumented.
