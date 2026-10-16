#!/usr/bin/env node
// Mirrors a published release of this repository into the product's own source repository, so its
// GitHub "Releases" box always shows the latest version with its installers (the source repos are
// private: installs still update from here, this copy is for the people who work on them).
//
//   node mirror.mjs --product app|cli --version X.Y.Z [--repo owner/name] [--commit <sha>]
//                   [--force] [--dry-run]
//
//   --repo     default: null-lnp/aix-code-app for app, null-lnp/aix-cli for cli
//   --commit   the commit the tag vX.Y.Z points at when it doesn't exist yet (default: the
//              repository's default branch). An existing tag is left where it is.
//   --force    replace the assets of a mirror that already exists
//
// The assets are downloaded from this repository's release <product>-vX.Y.Z (the same signed
// files installs get) and uploaded to release vX.Y.Z of the source repository, with the same
// title and notes. The newest version is marked "Latest". The GitHub token comes from
// `git credential fill` (the same login git push uses); it is never printed. publish.mjs runs this
// after every release; run it by hand to backfill or repair a mirror.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PUBLIC_REPO = 'null-lnp/aix-code-releases';
export const SOURCE_REPOS = { app: 'null-lnp/aix-code-app', cli: 'null-lnp/aix-cli' };

/** semver order of X.Y.Z (a pre-release sorts before its release). */
export function cmpVersion(a, b) {
  const parse = (v) => {
    const [core, pre] = String(v).replace(/^v/, '').split(/[-+]/, 2);
    return { nums: core.split('.').map((n) => parseInt(n, 10) || 0), pre: pre ?? null };
  };
  const x = parse(a);
  const y = parse(b);
  for (let i = 0; i < 3; i++) if (x.nums[i] !== y.nums[i]) return x.nums[i] < y.nums[i] ? -1 : 1;
  if (x.pre === y.pre) return 0;
  if (x.pre === null) return 1;
  if (y.pre === null) return -1;
  return x.pre < y.pre ? -1 : 1;
}

export function githubToken() {
  const cred = execFileSync('git', ['credential', 'fill'], { input: 'protocol=https\nhost=github.com\n\n' }).toString();
  const token = /password=(.+)/.exec(cred)?.[1]?.trim();
  if (!token) throw new Error('no GitHub token from `git credential fill`');
  return token;
}

/** A GitHub API client; a 404 is an error unless `maybe` (then null). */
export function githubApi(token) {
  return async (method, p, { body, headers = {}, maybe = false } = {}) => {
    const r = await fetch(p.startsWith('http') ? p : `https://api.github.com${p}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...headers },
      body,
    });
    if (r.status === 404 && maybe) return null;
    if (!r.ok) throw new Error(`${method} ${p.replace(/\?.*/, '')}: ${r.status} ${(await r.text()).slice(0, 300)}`);
    return r.status === 204 ? null : r.json();
  };
}

const jsonBody = (v) => ({ body: JSON.stringify(v), headers: { 'Content-Type': 'application/json' } });

/** Copies release <product>-v<version> of the public repo to release v<version> of `repo`. */
export async function mirrorRelease({ product, version, repo = SOURCE_REPOS[product], commit, force = false, dry = false, log = console.log }) {
  if (!SOURCE_REPOS[product]) throw new Error('product must be app or cli');
  const gh = githubApi(githubToken());
  const source = await gh('GET', `/repos/${PUBLIC_REPO}/releases/tags/${product}-v${version}`, { maybe: true });
  if (!source) throw new Error(`${PUBLIC_REPO} has no release ${product}-v${version}`);
  const tag = `v${version}`;
  const assets = source.assets.map((a) => ({ name: a.name, url: a.browser_download_url, size: a.size }));

  // "Latest" only for the newest version the source repo has
  const existing = (await gh('GET', `/repos/${repo}/releases?per_page=100`)) ?? [];
  const newest = existing.filter((r) => !r.draft && r.tag_name !== tag).every((r) => cmpVersion(r.tag_name, tag) < 0);

  let rel = existing.find((r) => r.tag_name === tag) ?? null;
  const complete = rel && !rel.draft && assets.every((a) => rel.assets.some((b) => b.name === a.name && b.size === a.size));
  if (complete && !force) {
    log(`${repo} ${tag}: already mirrored`);
    if (newest && !dry) await gh('PATCH', `/repos/${repo}/releases/${rel.id}`, jsonBody({ make_latest: 'true' }));
    return rel;
  }
  if (dry) {
    log(`${repo} ${tag}: would mirror ${assets.map((a) => a.name).join(', ')}${newest ? ' (Latest)' : ''}`);
    return null;
  }
  if (!rel) {
    rel = await gh('POST', `/repos/${repo}/releases`, jsonBody({
      tag_name: tag,
      ...(commit ? { target_commitish: commit } : {}),
      name: source.name,
      body: source.body,
      draft: true,
    }));
    log(`${repo} ${tag}: drafted`);
  }
  for (const a of assets) {
    const old = rel.assets.find((b) => b.name === a.name);
    if (old && old.size === a.size && !force) continue;
    const r = await fetch(a.url, { redirect: 'follow' });
    if (!r.ok) throw new Error(`download of ${a.name} failed: ${r.status}`);
    const data = Buffer.from(await r.arrayBuffer());
    if (data.length !== a.size) throw new Error(`download of ${a.name}: ${data.length} bytes, expected ${a.size}`);
    const fresh = await gh('POST', `https://uploads.github.com/repos/${repo}/releases/${rel.id}/assets?name=${encodeURIComponent(old ? `${a.name}.new` : a.name)}`, {
      body: data,
      headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': String(data.length) },
    });
    if (old) {
      await gh('DELETE', `/repos/${repo}/releases/assets/${old.id}`);
      await gh('PATCH', `/repos/${repo}/releases/assets/${fresh.id}`, jsonBody({ name: a.name }));
    }
    log(`${repo} ${tag}: uploaded ${a.name} (${(data.length / 1048576).toFixed(1)} MB)`);
  }
  rel = await gh('PATCH', `/repos/${repo}/releases/${rel.id}`, jsonBody({
    name: source.name,
    body: source.body,
    draft: false,
    make_latest: newest ? 'true' : 'false',
  }));
  log(`${repo} ${tag}: released${newest ? ' (Latest)' : ''} ${rel.html_url}`);
  return rel;
}

// ── command line ─────────────────────────────────────────────────────────────────────────────
if (process.argv[1] && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const opt = { force: false, dry: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const next = () => {
      const v = args[++i];
      if (v === undefined || v.startsWith('--')) throw new Error(`${a} needs a value`);
      return v;
    };
    if (a === '--product') opt.product = next();
    else if (a === '--version') opt.version = next().replace(/^v/, '');
    else if (a === '--repo') opt.repo = next();
    else if (a === '--commit') opt.commit = next();
    else if (a === '--force') opt.force = true;
    else if (a === '--dry-run') opt.dry = true;
    else throw new Error(`unknown argument ${a}`);
  }
  if (!SOURCE_REPOS[opt.product]) throw new Error('--product must be app or cli');
  if (!/^\d+\.\d+\.\d+([-+][\w.-]+)?$/.test(opt.version ?? '')) throw new Error('--version must be X.Y.Z');
  await mirrorRelease(opt);
}
