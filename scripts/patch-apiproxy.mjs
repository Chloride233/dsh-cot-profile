#!/usr/bin/env node
/**
 * Patch `dsh-host-apiproxy`'s WEB_SETTINGS_NAMESPACES to expose the
 * `cot-profile` settings namespace to the Web configuration client.
 *
 * This is a TEMPORARY workaround: DeepSeek Harness 0.1.0-rc.6 only exposes a
 * hard-coded allowlist of settings namespaces to the browser (the source
 * comment in dsh-host-apiproxy calls moving that decision to
 * settings.register() "deferred work"). Once upstream lands plugin-declared
 * settings exposure, this script and scripts/install-patch.sh can be deleted.
 *
 * Idempotent and structure-checking: fails loudly with a readable error when
 * the expected block is not found, instead of silently doing nothing.
 *
 * Usage: node patch-apiproxy.mjs <path-to-apiproxy-lib-index.js>
 */
import { readFileSync, writeFileSync } from 'node:fs';

const path = process.argv[2];
if (!path) {
  console.error('usage: node patch-apiproxy.mjs <path-to-dsh-host-apiproxy/lib/index.js>');
  process.exit(2);
}

const BLOCK_RE = /const WEB_SETTINGS_NAMESPACES = \[([\s\S]*?)\n\];/;
const NS = '"cot-profile"';

const text = readFileSync(path, 'utf8');
const match = text.match(BLOCK_RE);

if (!match) {
  console.error(`patch-apiproxy: WEB_SETTINGS_NAMESPACES block not found in ${path}`);
  console.error('This dsh version may have changed the whitelist layout, or the file is not the built apiproxy bundle.');
  console.error('If dsh now supports plugin-declared settings exposure, this script is obsolete — remove it.');
  process.exit(1);
}

if (match[1].includes(NS)) {
  console.log(`patch-apiproxy: ${path} already exposes cot-profile (nothing to do)`);
  process.exit(0);
}

const patched = text.replace(BLOCK_RE, (whole, inner) => {
  const trimmed = inner.trimEnd().replace(/,\s*$/, '');
  return `const WEB_SETTINGS_NAMESPACES = [${trimmed},\n\t${NS}\n];`;
});

writeFileSync(path, patched);
console.log(`patch-apiproxy: added cot-profile to WEB_SETTINGS_NAMESPACES in ${path}`);
