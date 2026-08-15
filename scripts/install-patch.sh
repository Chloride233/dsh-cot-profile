#!/bin/sh
# Optional, TEMPORARY patch that exposes the `cot-profile` settings namespace
# to the Web settings page (Settings -> 思维链画像).
#
# This is ONLY needed for the in-browser settings section. The plugin is fully
# functional without it — configure it via cordis config instead (see README).
#
# DeepSeek Harness 0.1.0-rc.6 keeps a hard-coded allowlist of settings
# namespaces in dsh-host-apiproxy; this script copies the installed apiproxy
# into the web profile and adds `cot-profile` to that allowlist. Once upstream
# supports plugin-declared settings exposure, delete this whole scripts/ dir.
set -e

PKG_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
PROFILE_DIR="${DSH_PROFILE_DIR:-$DSH_HOME/profiles/web}"

if ! command -v dsh >/dev/null 2>&1; then
  echo "error: dsh CLI not found on PATH" >&2
  exit 1
fi
if ! command -v node >/dev/null 2>&1; then
  echo "error: node is required to run the patch" >&2
  exit 1
fi

DASH_BIN="$(command -v dsh)"
APIPROXY_SRC="$(dirname "$(dirname "$DASH_BIN")")/@deepseek-ai/dsh-host-apiproxy"
if [ ! -d "$APIPROXY_SRC" ]; then
  echo "error: cannot find dsh-host-apiproxy at $APIPROXY_SRC" >&2
  echo "       (resolved from dsh binary at $DASH_BIN)" >&2
  exit 1
fi

mkdir -p "$PROFILE_DIR/node_modules/@deepseek-ai"
DEST="$PROFILE_DIR/node_modules/@deepseek-ai/dsh-host-apiproxy"
if [ ! -d "$DEST" ]; then
  cp -R "$APIPROXY_SRC" "$DEST"
  echo "==> copied dsh-host-apiproxy into $DEST"
else
  echo "==> using existing copy at $DEST (note: a pnpm install in the profile"
  echo "    will remove it; re-run this script afterwards)"
fi

node "$PKG_DIR/scripts/patch-apiproxy.mjs" "$DEST/lib/index.js"

echo
echo "==> Done. Open the Web UI and check Settings -> 思维链画像."
echo "    This is a temporary workaround; see README 'Upstream wishlist'."
