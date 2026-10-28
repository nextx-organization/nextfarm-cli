# Changelog

## 0.2.0

- Fix: the session no longer ends after 15 minutes. Refreshing the login sent the token under a key the NextFarm server ignores, so the CLI asked you to log in again.
- `nextfarm login --device`: log in on a machine with neither a browser nor the NextFarm app — enter the 8-letter code at id.nextfarm.vn/oauth/device on any other device.
- `nextfarm login --ci`: GitHub Actions and GitLab CI log in with the provider's OIDC token, no secret in the repository. Allow a repository and branch in the web app under Manage › API keys; each run gets a 15-minute session in your name. `nextfarm ci trust add|list|revoke` and `nextfarm ci example`.
- `nextfarm mcp serve --stdio` runs with `NEXTFARM_API_KEY` alone, so other assistants can use your farm tools without a login.
- `nextfarm api --help` shows a NextFarm request as its example.

## 0.1.0

First release.

- Chat with NextFarm AI on your farm's data in the terminal (`nextfarm`): slash commands, photo and document attachments, permission modes, confirmed writes with undo. Writes that touch devices, automation or money are confirmed in the NextFarm app only.
- Farm commands: `/sau-benh` (pest and disease from a photo), `/thoi-tiet` (weather), `/ban-tin` (morning brief), scheduled questions, farm memory; `ai apply|reject|undo` for proposals by id.
- Login: browser (PKCE), QR with the NextFarm app, API key (`NEXTFARM_API_KEY`).
- `-p` / `--json` / `--output-format stream-json` for scripts and agents.
- `tools`, `api`, `keys`, `webhooks` (including `listen --forward-to` and `verify`), `mcp install|serve`, `doctor`, `completion`, `update`, `init`.
- `--model`: run with your own model; farm tools come through MCP.
