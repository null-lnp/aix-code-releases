#!/usr/bin/env node
// Is every product's latest version released everywhere? Checks, for the app and the CLI:
//   - the version in the local source clone (../aix-code-app/package.json, ../aix-cli/Cargo.toml),
//   - <product>/latest.json here (what installs update to),
//   - the public release <product>-vX.Y.Z here (published, with its assets),
//   - the source repository's "Latest" release (vX.Y.Z, mirrored by mirror.mjs).
// Prints one line per check and exits 1 when anything lags behind.
//
//   node status.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cmpVersion, githubApi, githubToken, PUBLIC_REPO, SOURCE_REPOS } from './mirror.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const gh = githubApi(githubToken());
const clones = {
  app: () => JSON.parse(fs.readFileSync(path.join(root, '..', 'aix-code-app', 'package.json'), 'utf8')).version,
  cli: () => /^version\s*=\s*"([^"]+)"/m.exec(fs.readFileSync(path.join(root, '..', 'aix-cli', 'Cargo.toml'), 'utf8'))?.[1],
};
let bad = 0;
const line = (ok, text) => {
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'LAG '} ${text}`);
};

for (const product of ['app', 'cli']) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, product, 'latest.json'), 'utf8'));
  const v = manifest.version;
  let local = null;
  try {
    local = clones[product]();
  } catch {
    /* no clone next to this one */
  }
  if (local) line(cmpVersion(local, v) <= 0, `${product}: source clone at ${local}, manifest at ${v}${cmpVersion(local, v) > 0 ? ' (unreleased: build and run the release script)' : ''}`);
  const pub = await gh('GET', `/repos/${PUBLIC_REPO}/releases/tags/${product}-v${v}`, { maybe: true });
  line(!!pub && !pub.draft && pub.assets.length > 0, `${product}: public release ${product}-v${v} ${pub ? (pub.draft ? 'is a draft' : `has ${pub.assets.length} assets`) : 'is missing'}`);
  const repo = SOURCE_REPOS[product];
  const latest = await gh('GET', `/repos/${repo}/releases/latest`, { maybe: true });
  line(latest?.tag_name === `v${v}`, `${product}: ${repo} Latest release is ${latest?.tag_name ?? 'none'}${latest?.tag_name === `v${v}` ? '' : ` (run: node mirror.mjs --product ${product} --version ${v})`}`);
}
if (bad) {
  console.log(`${bad} check(s) behind`);
  process.exitCode = 1;
} else console.log('everything is released and mirrored');
