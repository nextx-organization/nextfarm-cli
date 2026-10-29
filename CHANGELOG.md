# Changelog

## 0.3.2

- Every file in a GitHub release now has a signed build provenance attestation: `gh attestation verify <file> --repo <owner/repo>`. Release notes list the install commands and how to verify a download.
- Security reports go through GitHub's private vulnerability reporting on this repository.

## 0.3.1

- Homebrew: NextFarm now has its own tap. Install with `brew install nextx-organization/nextfarm/nextfarm` (Scoop: `scoop bucket add nextfarm https://github.com/nextx-organization/homebrew-nextfarm`).
- `nextfarm ci policy list` shows the last 8 characters of each id (policies created together share the first ones); `show` and `revoke` accept either end and stop when a short id matches several policies.

## 0.3.0

- CI writes under a pre-approval policy. A `nextfarm login --ci` run now applies a proposed farm write on its own when a policy of that repository covers every line, has room under its record ceiling and has not expired (30 days at most); otherwise nothing is written and the run prints the link to confirm, as before. The server enforces this, not the CLI. Devices, irrigation, money and high-risk lines always need a person in the app. With `--json`, the result is under `proposals[0].applied`.
- `nextfarm ci policy request|list|show|revoke|kinds`. A request waits for someone who manages API keys; with that permission, `--approve` makes it active at once. Policies are also managed in the web app under Manage › API keys.
- Irrigation runs and irrigation schedule changes are treated as device actions: they are confirmed in the app only.
- `nextfarm -p` exits 0 when the proposed write went through in that run; exit 7 now means a write is still waiting for confirmation.

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
