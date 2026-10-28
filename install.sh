#!/bin/sh
# Installs the nextfarm CLI from GitHub releases. Usage: curl -fsSL https://developers.nextfarm.vn/install.sh | sh
# Options (environment): NEXTFARM_VERSION=1.2.3  NEXTFARM_INSTALL_DIR=$HOME/.local/bin
set -eu
REPO="nextx-organization/nextfarm-cli"
BIN="nextfarm"
VERSION="${NEXTFARM_VERSION:-latest}"
DIR="${NEXTFARM_INSTALL_DIR:-$HOME/.local/bin}"

case "$(uname -s)" in
  Darwin) os=darwin ;;
  Linux) os=linux ;;
  *) echo "Unsupported OS: $(uname -s). On Windows use: irm https://developers.nextfarm.vn/install.ps1 | iex" >&2; exit 1 ;;
esac
case "$(uname -m)" in
  arm64|aarch64) arch=arm64 ;;
  x86_64|amd64) arch=x64 ;;
  *) echo "Unsupported CPU: $(uname -m)" >&2; exit 1 ;;
esac

if [ "$VERSION" = latest ]; then base="https://github.com/$REPO/releases/latest/download"; else base="https://github.com/$REPO/releases/download/v${VERSION#v}"; fi
asset="$BIN-$os-$arch.tar.gz"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
echo "Downloading ${asset}..."
curl -fsSL "$base/$asset" -o "$tmp/$asset"
curl -fsSL "$base/SHA256SUMS" -o "$tmp/SHA256SUMS"
expected="$(grep " $asset\$" "$tmp/SHA256SUMS" | cut -d' ' -f1)"
if command -v sha256sum >/dev/null 2>&1; then actual="$(sha256sum "$tmp/$asset" | cut -d' ' -f1)"; else actual="$(shasum -a 256 "$tmp/$asset" | cut -d' ' -f1)"; fi
if [ -z "$expected" ] || [ "$expected" != "$actual" ]; then echo "Checksum mismatch for $asset" >&2; exit 1; fi
tar -xzf "$tmp/$asset" -C "$tmp"
mkdir -p "$DIR"
install -m 0755 "$tmp/$BIN" "$DIR/$BIN"
echo "Installed $("$DIR/$BIN" --version 2>/dev/null || echo "$BIN") to $DIR/$BIN"
case ":$PATH:" in
  *":$DIR:"*) ;;
  *) echo "Add it to your PATH:  echo 'export PATH=\"$DIR:\$PATH\"' >> ~/.$(basename "${SHELL:-sh}")rc" ;;
esac
echo "Next: $BIN login"
