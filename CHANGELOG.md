# Changelog

## 0.1.0

First release.

- Chat with NextFarm AI on your farm's data in the terminal (`nextfarm`): slash commands, photo and document attachments, permission modes, confirmed writes with undo. Writes that touch devices, automation or money are confirmed in the NextFarm app only.
- Farm commands: `/sau-benh` (pest and disease from a photo), `/thoi-tiet` (weather), `/ban-tin` (morning brief), scheduled questions, farm memory; `ai apply|reject|undo` for proposals by id.
- Login: browser (PKCE), QR with the NextFarm app, API key (`NEXTFARM_API_KEY`).
- `-p` / `--json` / `--output-format stream-json` for scripts and agents.
- `tools`, `api`, `keys`, `webhooks` (including `listen --forward-to` and `verify`), `mcp install|serve`, `doctor`, `completion`, `update`, `init`.
- `--model`: run with your own model; farm tools come through MCP.
