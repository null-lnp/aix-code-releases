#!/usr/bin/env node
// Publishes a release of Aix Code (product "app") or the aix CLI (product "cli") to this public
// repository, the only place installed apps can read updates from (the source repos are private):
//
//   1. uploads the assets to a draft GitHub release <product>-v<version>, then publishes it,
//   2. writes <product>/latest.json — the manifest the updaters read through
//      https://raw.githubusercontent.com/null-lnp/aix-code-releases/main/<product>/latest.json —
//      and copies the product's changelog to <product>/CHANGELOG.md (+ the README's version table),
//   3. commits and pushes this repository,
//   4. mirrors the release into the product's source repository (release vX.Y.Z there, marked
//      Latest, same installers — see mirror.mjs), so its GitHub "Releases" box is never stale.
//
// The manifest changes only after every asset is uploaded and the release is public, so it never
// points at a missing file. Publishing a version that isn't newer than the current manifest's, or
// one that is already released, needs --force (assets are then swapped without a gap).
//
//   node publish.mjs --product app|cli --version X.Y.Z --changelog <CHANGELOG.md>
//                    --platform <key>=<file> [--platform …] [--asset <file> …]
//                    [--name <file>=<name> …] [--commit <sha>] [--no-mirror] [--force] [--dry-run]
//
//   --platform  an updater asset for a platform key (Tauri naming: windows-x86_64,
//               windows-x86_64-nsis, windows-x86_64-msi, linux-x86_64, darwin-aarch64…).
//               Its signature is read from <file>.sig (minisign, as `tauri signer sign` writes)
//               and uploaded as <name>.sig. Several keys may name the same file.
//   --asset     an extra file attached to the release (not in the manifest).
//   --name      upload <file> under <name> (default: its file name). Names must be plain
//               (letters, digits, . _ + -): GitHub rewrites other characters.
//   --commit    the source repository's commit for the mirror's tag vX.Y.Z (default: its
//               default branch)
//   --no-mirror skip step 4 (run `node mirror.mjs` later)
//   --dry-run   prints the manifest and writes it to a temp folder; touches nothing else.
//
// The GitHub token comes from `git credential fill` (the same login git push uses); it is never printed.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mirrorRelease, SOURCE_REPOS } from './mirror.mjs';

const REPO = 'null-lnp/aix-code-releases';
const BRANCH = 'main';
const root = path.dirname(fileURLToPath(import.meta.url));
const TITLES = { app: 'Aix Code', cli: 'aix CLI' };
const SAFE_NAME = /^[A-Za-z0-9._+-]+$/;

// ── arguments ────────────────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const opt = { platforms: [], assets: [], names: new Map(), dry: false, force: false, mirror: true };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  const next = () => {
    const v = args[++i];
    if (v === undefined || v.startsWith('--')) throw new Error(`${a} needs a value`);
    return v;
  };
  if (a === '--product') opt.product = next();
  else if (a === '--version') opt.version = next().replace(/^v/, '');
  else if (a === '--changelog') opt.changelog = path.resolve(next());
  else if (a === '--platform') {
    const v = next();
    const eq = v.indexOf('=');
    if (eq < 1) throw new Error(`--platform wants <key>=<file>, got ${v}`);
    opt.platforms.push({ key: v.slice(0, eq), file: path.resolve(v.slice(eq + 1)) });
  } else if (a === '--asset') opt.assets.push(path.resolve(next()));
  else if (a === '--name') {
    const v = next();
    const eq = v.lastIndexOf('=');
    if (eq < 1) throw new Error(`--name wants <file>=<name>, got ${v}`);
    opt.names.set(path.resolve(v.slice(0, eq)), v.slice(eq + 1));
  } else if (a === '--dry-run') opt.dry = true;
  else if (a === '--force') opt.force = true;
  else if (a === '--commit') opt.commit = next();
  else if (a === '--no-mirror') opt.mirror = false;
  else throw new Error(`unknown argument ${a}`);
}
if (!TITLES[opt.product]) throw new Error('--product must be app or cli');
if (!/^\d+\.\d+\.\d+([-+][\w.-]+)?$/.test(opt.version ?? '')) throw new Error('--version must be X.Y.Z');
if (!opt.platforms.length) throw new Error('at least one --platform <key>=<file> is needed');
const { product, version } = opt;
const tag = `${product}-v${version}`;
const title = `${TITLES[product]} ${version}`;

/** semver order of X.Y.Z (a pre-release sorts before its release). */
function cmpVersion(a, b) {
  const parse = (v) => {
    const [core, pre] = String(v).split(/[-+]/, 2);
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

// ── assets, signatures, notes ────────────────────────────────────────────────────────────────
const files = new Map(); // upload name → local file
const addFile = (file, name = opt.names.get(file) ?? path.basename(file)) => {
  if (!fs.existsSync(file)) throw new Error(`missing ${file}`);
  if (!SAFE_NAME.test(name)) throw new Error(`asset name "${name}" has characters GitHub rewrites — pass --name ${file}=<plain-name>`);
  if (files.has(name) && files.get(name) !== file) throw new Error(`two files would upload as ${name}`);
  files.set(name, file);
  return name;
};
const url = (name) => `https://github.com/${REPO}/releases/download/${tag}/${name}`;
const platforms = {};
for (const { key, file } of opt.platforms) {
  const name = addFile(file);
  const sigFile = `${file}.sig`;
  if (!fs.existsSync(sigFile)) throw new Error(`missing ${sigFile} — sign the file first (tauri signer sign)`);
  addFile(sigFile, `${name}.sig`);
  platforms[key] = {
    signature: fs.readFileSync(sigFile, 'utf8').trim(),
    url: url(name),
    sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
  };
}
for (const file of opt.assets) addFile(file);

let changelog = '';
let notes = title;
if (opt.changelog) {
  changelog = fs.readFileSync(opt.changelog, 'utf8').replace(/\r\n/g, '\n');
  const head = new RegExp(`^## v?${version.replace(/[.+]/g, '\\$&')}(\\s|$)`);
  const section = changelog.split(/\n(?=## )/).find((s) => head.test(s));
  if (section) notes = section.split('\n').slice(1).join('\n').trim();
  else console.warn(`warning: no "## v${version}" section in ${opt.changelog}`);
}

const manifest = { product, version, notes, pub_date: new Date().toISOString(), tag, platforms };
console.log(`${title}: ${files.size} assets, platforms ${Object.keys(platforms).join(', ')}`);

if (opt.dry) {
  const out = path.join(os.tmpdir(), 'aix-publish-dry-run', product);
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'latest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`dry run: ${path.join(out, 'latest.json')} (nothing uploaded, the releases repo untouched)`);
  for (const [name, file] of files) console.log(`  would upload ${name}  ←  ${file}`);
  if (opt.mirror) console.log(`  would mirror ${tag} to ${SOURCE_REPOS[product]} as v${version}${opt.commit ? ` (tag at ${opt.commit})` : ''}`);
  process.exit(0);
}

// ── this repository ──────────────────────────────────────────────────────────────────────────
const git = (...a) => execFileSync('git', ['-C', root, ...a], { encoding: 'utf8' }).trim();
const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
if (branch !== BRANCH) throw new Error(`the releases repo is on "${branch}", not ${BRANCH}`);
const owned = [product, 'README.md'];
const dirty = git('status', '--porcelain', '--', ...owned);
if (dirty) throw new Error(`uncommitted changes in the releases repo:\n${dirty}`);
git('pull', '--ff-only', '--quiet', 'origin', BRANCH);
const manifestFile = path.join(root, product, 'latest.json');
const current = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : null;
if (current && cmpVersion(version, current.version) <= 0 && !opt.force) {
  throw new Error(`${product}/latest.json is at ${current.version}; publishing ${version} needs --force (re-release or downgrade)`);
}

// ── GitHub release ───────────────────────────────────────────────────────────────────────────
const cred = execFileSync('git', ['credential', 'fill'], { input: 'protocol=https\nhost=github.com\n\n' }).toString();
const token = /password=(.+)/.exec(cred)?.[1]?.trim();
if (!token) throw new Error('no GitHub token from `git credential fill`');
/** GitHub API call; a 404 is an error unless `maybe` (then null). */
const gh = async (method, p, { body, headers = {}, maybe = false } = {}) => {
  const r = await fetch(p.startsWith('http') ? p : `https://api.github.com${p}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...headers },
    body,
  });
  if (r.status === 404 && maybe) return null;
  if (!r.ok) throw new Error(`${method} ${p.replace(/\?.*/, '')}: ${r.status} ${(await r.text()).slice(0, 300)}`);
  return r.status === 204 ? null : r.json();
};
const jsonBody = (v) => ({ body: JSON.stringify(v), headers: { 'Content-Type': 'application/json' } });
const upload = async (rel, name, file) => {
  const data = fs.readFileSync(file);
  const asset = await gh('POST', `https://uploads.github.com/repos/${REPO}/releases/${rel.id}/assets?name=${encodeURIComponent(name)}`, {
    body: data,
    headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': String(data.length) },
  });
  if (asset?.name !== name || asset?.state !== 'uploaded') throw new Error(`upload of ${name} came back as ${asset?.name} (${asset?.state})`);
  console.log(`uploaded ${name} (${(data.length / 1048576).toFixed(1)} MB)`);
  return asset;
};

let rel = await gh('GET', `/repos/${REPO}/releases/tags/${tag}`, { maybe: true });
if (rel) {
  // already public: installs may be downloading these files right now — swap without a gap
  if (!opt.force) throw new Error(`${tag} is already released; pass --force to replace its assets`);
  console.log(`replacing the assets of ${tag}`);
  for (const [name, file] of files) {
    const old = rel.assets.find((a) => a.name === name);
    const fresh = await upload(rel, old ? `${name}.new` : name, file);
    if (old) {
      await gh('DELETE', `/repos/${REPO}/releases/assets/${old.id}`);
      await gh('PATCH', `/repos/${REPO}/releases/assets/${fresh.id}`, jsonBody({ name }));
    }
  }
  rel = await gh('PATCH', `/repos/${REPO}/releases/${rel.id}`, jsonBody({ name: title, body: notes }));
} else {
  // a draft (from an interrupted run, or new) is invisible until every asset is in
  const drafts = (await gh('GET', `/repos/${REPO}/releases?per_page=100`)) ?? [];
  rel = drafts.find((r) => r.draft && r.tag_name === tag);
  if (rel) {
    for (const a of rel.assets) await gh('DELETE', `/repos/${REPO}/releases/assets/${a.id}`);
    console.log(`resuming the draft of ${tag}`);
  } else {
    rel = await gh('POST', `/repos/${REPO}/releases`, jsonBody({ tag_name: tag, target_commitish: BRANCH, name: title, body: notes, draft: true }));
    console.log(`drafted ${tag}`);
  }
  for (const [name, file] of files) await upload(rel, name, file);
  // the "Latest" badge follows the desktop app
  rel = await gh('PATCH', `/repos/${REPO}/releases/${rel.id}`, jsonBody({ tag_name: tag, target_commitish: BRANCH, name: title, body: notes, draft: false, make_latest: product === 'app' ? 'true' : 'false' }));
  console.log(`released ${tag}`);
}

// ── manifest + push ──────────────────────────────────────────────────────────────────────────
fs.mkdirSync(path.join(root, product), { recursive: true });
fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
if (changelog) fs.writeFileSync(path.join(root, product, 'CHANGELOG.md'), changelog);
updateReadme();
git('add', '--', ...owned);
git('commit', '--quiet', '-m', `${product} v${version}`, '--', ...owned);
try {
  git('push', '--quiet', 'origin', BRANCH);
} catch (e) {
  throw new Error(`the release is up but pushing the manifest failed — fix it and run \`git -C ${root} push\`:\n${e.message}`);
}
console.log(`published ${title}: ${rel.html_url}`);
console.log(`manifest: https://raw.githubusercontent.com/${REPO}/${BRANCH}/${product}/latest.json (raw caches ~5 min)`);

// ── mirror into the source repository ────────────────────────────────────────────────────────
if (opt.mirror) {
  try {
    await mirrorRelease({ product, version, commit: opt.commit, force: opt.force });
  } catch (e) {
    console.error(`the release is up, but mirroring it to ${SOURCE_REPOS[product]} failed — run \`node ${path.join(root, 'mirror.mjs')} --product ${product} --version ${version}\`:\n${e.message}`);
    process.exitCode = 1;
  }
}

/** The "Latest versions" table between the markers in README.md. */
function updateReadme() {
  const file = path.join(root, 'README.md');
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, 'utf8');
  const start = '<!-- latest:start -->';
  const end = '<!-- latest:end -->';
  const a = text.indexOf(start);
  const b = text.indexOf(end);
  if (a < 0 || b < a) return;
  const read = (p) => {
    try {
      return JSON.parse(fs.readFileSync(path.join(root, p, 'latest.json'), 'utf8'));
    } catch {
      return null;
    }
  };
  const rows = ['| Product | Version | Released | Downloads |', '| --- | --- | --- | --- |'];
  for (const p of ['app', 'cli']) {
    const m = read(p);
    if (!m) continue;
    const links = [...new Set(Object.values(m.platforms).map((x) => x.url))].map((u) => `[${u.split('/').pop()}](${u})`).join(' · ');
    rows.push(`| ${TITLES[p]} | [${m.version}](https://github.com/${REPO}/releases/tag/${m.tag}) | ${m.pub_date.slice(0, 10)} | ${links} |`);
  }
  fs.writeFileSync(file, `${text.slice(0, a + start.length)}\n${rows.join('\n')}\n${text.slice(b)}`);
}
