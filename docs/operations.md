# Operations runbook

Short, copy-pasteable procedures for the things that are not code: data
recovery, schema changes, attachment storage and the checks that need real
credentials.

## 1. Database backup and restore

Postgres runs from `infra/compose.yaml`; the volume is `hermes_db`. Back up with
a logical dump so the file can be restored into a different host or version:

```sh
docker compose -f infra/compose.yaml exec -T db \
  pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB" > "backup-$(date +%F-%H%M).dump"
```

Restore into an empty database (stop the API first so nothing writes mid-restore):

```sh
docker compose -f infra/compose.yaml stop api
docker compose -f infra/compose.yaml exec -T db \
  pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists < backup-YYYY-MM-DD-HHMM.dump
docker compose -f infra/compose.yaml start api
docker compose -f infra/compose.yaml exec api bun run --cwd packages/db migrate
```

Keep at least one dump off the host. The `uploads` volume (or the bucket, when
`STORAGE_DRIVER=s3`) must be backed up alongside the database, or attachments
will 404 after a restore.

## 2. Migration dry run

Migrations are plain SQL in `packages/db/src/<feature>/migrations`. Rehearse
against a scratch database before touching production:

```sh
createdb hermes_dryrun
DATABASE_URL=postgres://localhost/hermes_dryrun bun run --cwd packages/db migrate
DATABASE_URL=postgres://localhost/hermes_dryrun bun run --cwd packages/db seed --demo
```

If the seed fails, the migration dropped or renamed something the seeders still
reference — fix that before deploying.

## 3. Attachment storage

`STORAGE_DRIVER=local` (default) writes to `UPLOAD_DIR` on the API host and is
correct for a single replica. Set `STORAGE_DRIVER=s3` to share attachments
between replicas or to survive a lost disk:

| Variable | Notes |
| --- | --- |
| `S3_BUCKET` | One bucket; objects are keyed by a random id plus the validated extension. |
| `S3_REGION` | `auto` for Cloudflare R2, otherwise the real region. |
| `S3_ENDPOINT` | Empty for AWS; the account endpoint for R2, MinIO or Backblaze. |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Credentials with object read/write on that bucket only. |
| `S3_FORCE_PATH_STYLE` | `true` for MinIO and other path-style providers. |

Attachment bytes are private; the API checks case access before streaming them.
Production boot refuses a half-configured S3 driver. Switching drivers does not
copy existing files: move the `uploads` directory into the bucket (for example
`rclone copy uploads remote:bucket`) before flipping the variable, or old
attachments disappear from the UI.

## 4. Verifying email and SMS

Both are code-complete and unverified without credentials:

1. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`,
   `MAIL_FROM` and restart the API.
2. `POST /staff/invites` for a real address; the invite must arrive and the
   response must report `emailSent: true`.
3. Request a password reset and open the link from the inbox.
4. Set `SMS_WEBHOOK_URL` to a gateway accepting `{ "to": "...", "text": "..." }`,
   then request a patient code and confirm arrival.
5. Check `email_logs` (status `sent`/`failed`) and the delivery page in the
   dashboard for the outbox.

Without SMTP the API fails loudly for invites and resets and logs opt-in alerts
as `skipped`, so nothing silently pretends to have been delivered.

## 5. Gates and CI

`bun run verify` runs format check, lint, guardrails, typecheck and tests.
`.github/workflows/ci.yml` reproduces it plus `docker compose config` and
`caddy validate`; it must be pushed with a token that has `workflow` scope.
Until then, run the same commands locally before tagging a release.
