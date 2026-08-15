# dsh-cot-profile

Real-time chain-of-thought trajectory profiling for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness): watch the reasoning stream as it happens, tally signature wording indicators (`let me` / `we` / `let's` / `I`), classify the current session's trajectory family against built-in baselines, and optionally record per-session measurement aggregates.

## Read this first: honest framing

Wording fingerprints describe the **(model × assembly) combination** — system prompt, tool schema, reasoning effort — **not model identity**. The underlying research ([`xiaobright/modeltest`](https://github.com/xiaobright/modeltest)) shows the same wording pattern across different models when the interface changes (the V4 Flash counterexample: identical `we`-heavy, `let me`-free reasoning under the minimal assembly, at a different ability level).

This plugin tells you **which trajectory family the current session behaves like** (minimal-like / standard-like / gray-like) and shows you the raw indicators side by side, so you draw your own conclusions. It does not assert "this is model X".

## Features

- **Live UI**: session-header badge + collapsible floating panel, updated by session-projection push frames — no polling, no custom RPC.
- **Indicators**: `let me` / `we` / `let's` / `I` counts, first-line patterns (`We need…` / `The user wants…` / `Let me…` / `I…`), block-length median, interim visible replies.
- **Judgment**: weighted-distance match against built-in profile baselines with confidence; verdicts only after N blocks (default 10, configurable).
- **Extensible**: user-editable profile families and per-dimension weights (Web settings or cordis config).
- **Record mode**: one aggregate JSON record per session at session end (event and/or JSONL) — the measurement instrument that calibrates the baselines with real data.
- **Privacy**: only aggregates ever leave the host computation; raw reasoning text is never recorded or transmitted.

## Install

```bash
dsh plugin --profile web add github:Chloride233/dsh-cot-profile
```

The core plugin (badge, panel, records) works immediately. The **Web settings section** additionally needs a temporary one-time patch to DeepSeek Harness 0.1.0-rc.6 (see [Optional: Web settings](#optional-web-settings-section)); without it, configure via cordis config below.

## Configure

Configuration lives in the `cot-profile` plugin row (`cordis.patch.yml` of this repo, or your profile's cordis.yml). Defaults:

```yaml
- id: cot-profile
  config:
    minBlocksForJudgment: 10   # verdict only after N reasoning blocks
    badge: true                # session-header badge
    panel: true                # real-time panel
    panelMode: overlay         # 'overlay' (default, zero risk) | 'track' (experimental right column)
    weights: {}                # per-dimension weights; {} = built-in defaults
    profiles: []               # custom profile families; [] = built-in baselines
    record:
      emit: true               # emit cot-profile/record at session end
      file: ''                 # optional JSONL path, e.g. ~/.dsh/cot-profile/records.jsonl
```

**Panel modes:**

- `overlay` (default): floating panel pinned to the right edge of the conversation — an official additive slot, zero risk.
- `track` (**experimental**): a real right column appended to the shell's three-column grid via direct DOM manipulation (MutationObserver over `grid-template-columns`). It does not cover content and does not replace any shipped UI, but it operates outside the official slot system — a DSH upgrade that changes the frame structure may require adapting this mode. Off by default.

Weights (defaults, `let me`/`we` dominate per research separation):

```json
{ "letMe100": 3, "we100": 3, "lets100": 2, "i100": 1.5,
  "firstLineWeNeed": 1.5, "firstLineUserWants": 1, "firstLineLetMe": 1.5,
  "firstLineI": 1, "firstLineOther": 0.5, "p50BlockChars": 1, "visibleReplies": 1.5 }
```

A custom profile is `{ "id", "name", "description", "vector" }` with any of the vector dims; add one per model/version you want to track and judge against.

## Optional: Web settings section

DeepSeek Harness 0.1.0-rc.6 exposes only a hard-coded allowlist of settings namespaces to the browser (`WEB_SETTINGS_NAMESPACES` in `dsh-host-apiproxy`; its source comment calls moving that decision to `settings.register()` *deferred work*). Until upstream lands plugin-declared settings exposure, run:

```bash
sh scripts/install-patch.sh
```

This copies the installed `dsh-host-apiproxy` into the web profile and adds `cot-profile` to the allowlist. It is **idempotent and optional** — the plugin is fully functional without it. Caveats:

- A `pnpm install` in the profile directory removes the copied package; re-run the script afterwards.
- A dsh upgrade may change the allowlist layout; the patch script fails loudly (never silently) when it cannot find the block.

## FAQ

- **Local-path install fails to load?** `dsh plugin add <local-dir>` installs via pnpm's `link:` protocol, which resolves the linked package's imports from its own directory — so the checkout needs a resolvable `node_modules`. Run `pnpm install` in the checkout (or symlink it to the running harness's node_modules). Installing from the GitHub URL (`github:...`) does not have this issue — pnpm resolves dependencies from its store natively.

## Events & data

| Surface | Shape |
| --- | --- |
| Projection key | `cot-profile` — read it in any session-scoped slot via `useProjection('cot-profile')` (typed as `CotProfileView` in `lib/index.d.ts`) |
| `cot-profile/update` | `{ sessionId, blocks, counts, firstLines, p50BlockChars, visibleReplies, vector, judgment, ui, revision, seq }` (throttled 500ms) |
| `cot-profile/record` | one aggregate record at session end (only when the session had ≥1 reasoning block) |

### Record schema (v1)

```jsonc
{
  "v": 1,
  "sessionId": "...",
  "startedAt": 1720000000000,
  "endedAt": 1720000100000,
  "preset": "anchored-standard",        // when known (agent-preset/selected)
  "provider": "deepseek",               // when known (agent/request capture)
  "model": "deepseek-v4-pro",           // when known
  "reasoningBlocks": 193,
  "indicators": { "letMe": 1, "we": 179, "lets": 88, "i": 17,
                  "p50BlockChars": 111, "visibleReplies": 1,
                  "firstLines": { "we-need": 120, "other": 73 } },
  "vector": { /* normalized indicator vector */ },
  "judgment": { "family": "minimal-like", "confidence": 0.87, "distances": {} }
}
```

**Privacy boundary (hard requirement):** records contain only aggregates — never raw reasoning text. File recording is off by default and opt-in.

### GUI calibration (semi-automatic)

The settings section (**Settings → 思维链画像 → 数据校准**) scans the configured record file, groups records by (provider, model, preset), aggregates indicator-vector means per group, and offers a one-click **"应用为画像族"** — writing the measured group as a new profile-family into the `profiles` config. Aggregation is automatic; applying is always a human decision, and the built-in baselines are never rewritten automatically.

The scan reads `GET /cot-profile/records` — a route the plugin registers on the web server. It reads **only** the configured `record.file` path and returns aggregates (never raw reasoning text); without a configured file it returns an empty result. If the settings section shows a scan error, confirm the JSONL path is set and a few sessions have ended.

## Development

```bash
npm test          # node --test test/analyzer.test.js (zero dependencies)
```

- `lib/analyzer.js` — pure analysis (tokenize, counts, first-line classes, vector, distance, judgment)
- `lib/profiles.js` — built-in baselines (marked **estimates** — calibrate with record-mode data)
- `lib/index.js` — host: session projection, events, record sink
- `lib/client.js` — badge, panel, settings section

## Upstream wishlist

Both are temporary gaps in DeepSeek Harness 0.1.0-rc.6 this plugin works around:

1. **Plugin-declared settings exposure** — move the settings namespace allowlist from `dsh-host-apiproxy` into `settings.register()` so plugins can expose their own configuration without patching a bundle.
2. **Additive right-column slot** — a `conversation.details.panel`-style list seat so a floating panel can become a native right column.

## License

MIT. See [LICENSE](./LICENSE). Built on the trajectory methodology of [`xiaobright/dsh-anchored-standard`](https://github.com/xiaobright/dsh-anchored-standard) and [`xiaobright/modeltest`](https://github.com/xiaobright/modeltest) (MIT, aggregates only).
