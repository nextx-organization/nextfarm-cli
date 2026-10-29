# NextFarm CLI

`nextfarm` brings NextFarm AI and the NextFarm developer platform to your terminal.

- **Chat** with NextFarm AI on your real workspace data: type `nextfarm`.
- **Script it**: `nextfarm -p "question" --json`, stream with `--output-format stream-json`.
- **Developer tools**: call the API, AI tools, API keys, webhooks (`nextfarm webhooks listen --forward-to localhost:3000`), MCP setup for other assistants.

Documentation: https://developers.nextfarm.vn/docs/cli

## Install

macOS / Linux:

```bash
curl -fsSL https://developers.nextfarm.vn/install.sh | sh
```

Windows (PowerShell):

```powershell
irm https://developers.nextfarm.vn/install.ps1 | iex
```

Homebrew:

```bash
brew install nextx-organization/nextfarm/nextfarm
```

npm (Node 20+):

```bash
npm install -g nextfarm
```

## Quick start

```bash
nextfarm login          # browser, or --qr over SSH
nextfarm                # open the chat
nextfarm -p "which plots are due for harvest this week"
nextfarm doctor
```

In CI, use an API key (`NEXTFARM_API_KEY`).

## Security

Tokens are kept in the operating system keychain when available. Writes proposed by the assistant are never applied without your confirmation in an interactive terminal. Report vulnerabilities as described in [SECURITY.md](SECURITY.md).

## License

MIT
