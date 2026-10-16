#!/usr/bin/env node
// Publishes a release of aix Code (product "app") or the aix CLI (product "cli") to this public
// repository, the only place installed apps can read updates from (the source repos are private):
//
//   1. creates (or updates) the GitHub release <product>-v<version> and uploads the assets,
//   2. writes <product>/latest.json — the manifest the updaters read through
//      https://raw.githubusercontent.com/null-lnp/aix-code-releases/main/<product>/latest.json —
//      and copies the product's changelog to <product>/CHANGELOG.md,
//   3. commits and pushes this repository.
//
// The manifest is written only after every asset is uploaded, so it never points at a missing file.
//
//   node publish.mjs --product app|cli --version X.Y.Z --changelog <CHANGELOG.md>
//                    --platform <key>=<file> [--platform …] [--asset <file> …] [--dry-run]
//
//   --platform  an updater asset for a platform key (Tauri naming: windows-x86_64,
//               windows-x86_64-nsis, windows-x86_64-msi, linux-x86_64, darwin-aarch64…).
//               Its signature is read from <file>.sig (minisign, as `tauri signer sign` writes).
//               Several keys may name the same file.
//   --asset     an extra file attached to the release (not in the manifest).
//   --name      <file>=<name>: upload a file under another name (default: its file name).
//
// The GitHub token comes from `git credential fill` (the same login git push uses).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = 'null-lnp/aix-code-releases';
const BRANCH = 'main';
const root = path.dirname(fileURLToPath(import.meta.url));
const TITLES = { app: 'aix Code', cli: 'aix CLI' };

// ── arguments ────────────────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const opt = { platforms: [], assets: [], names: new Map(), dry: false };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  const next = () => {
    const v = args[++i];
    if (v === undefined) throw new Error(`${a} needs a value`);
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
  else throw new Error(`unknown argument ${a}`);
}
if (!TITLES[opt.product]) throw new Error('--product must be app or cli');
if (!/^\d+\.\d+\.\d+([-+][\w.-]+)?$/.test(opt.version ?? '')) throw new Error('--version must be X.Y.Z');
if (!opt.platforms.length) throw new Error('at least one --platform <key>=<file> is needed');
const { product, version } = opt;
const tag = `${product}-v${version}`;
const title = `${TITLES[product]} ${version}`;

// ── assets, signatures, notes ────────────────────────────────────────────────────────────────
const nameOf = (file) => opt.names.get(file) ?? path.basename(file);
const files = new Map(); // upload name → local file
const addFile = (file) => {
  if (!fs.existsSync(file)) throw new Error(`missing ${file}`);
  const name = nameOf(file);
  if (files.has(name) && files.get(name) !== file) throw new Error(`two files would upload as ${name}`);
  files.set(name, file);
  return name;
};
const url = (name) => `https://github.com/${REPO}/releases/download/${tag}/${encodeURIComponent(name)}`;
const platforms = {};
for (const { key, file } of opt.platforms) {
  const name = addFile(file);
  const sigFile = `${file}.sig`;
  if (!fs.existsSync(sigFile)) throw new Error(`missing ${sigFile} — sign the file first (tauri signer sign)`);
  const sigName = `${name}.sig`;
  if (files.has(sigName) && files.get(sigName) !== sigFile) throw new Error(`two files would upload as ${sigName}`);
  files.set(sigName, sigFile);
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
  changelog = fs.readFileSync(opt.changelog, 'utf8');
  const section = changelog.split(/\r?\n(?=## )/).find((s) => s.startsWith(`## v${version}`) || s.startsWith(`## ${version}`));
  if (section) notes = section.split(/\r?\n/).slice(1).join('\n').trim();
  else console.warn(`warning: no "## v${version}" section in ${opt.changelog}`);
}

const manifest = { product, version, notes, pub_date: new Date().toISOString(), tag, platforms };

// ── this repository ──────────────────────────────────────────────────────────────────────────
const git = (...a) => execFileSync('git', ['-C', root, ...a], { encoding: 'utf8' }).trim();
const dirty = git('status', '--porcelain', '--', product);
if (dirty && !opt.dry) throw new Error(`uncommitted changes in ${product}/ of the releases repo:\n${dirty}`);
const writeManifest = () => {
  const dir = path.join(root, product);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'latest.json'), JSON.stringify(manifest, null, 2) + '\n');
  if (changelog) fs.writeFileSync(path.join(dir, 'CHANGELOG.md'), changelog.replace(/\r\n/g, '\n'));
  updateReadme();
};
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
    const links = [...new Set(Object.values(m.platforms).map((x) => x.url))]
      .map((u) => `[${decodeURIComponent(u.split('/').pop())}](${u})`)
      .join(' · ');
    rows.push(`| ${TITLES[p]} | [${m.version}](https://github.com/${REPO}/releases/tag/${m.tag}) | ${m.pub_date.slice(0, 10)} | ${links} |`);
  }
  fs.writeFileSync(file, `${text.slice(0, a + start.length)}\n${rows.join('\n')}\n${text.slice(b)}`);
}

console.log(`${title}: ${files.size} assets, platforms ${Object.keys(platforms).join(', ')}`);
if (opt.dry) {
  writeManifest();
  console.log(`dry run: wrote ${product}/latest.json (not committed, nothing uploaded)`);
  process.exit(0);
}
git('pull', '--ff-only', '--quiet', 'origin', BRANCH);

// ── GitHub release ───────────────────────────────────────────────────────────────────────────
const cred = execFileSync('git', ['credential', 'fill'], { input: 'protocol=https\nhost=github.com\n\n' }).toString();
const token = /password=(.+)/.exec(cred)?.[1]?.trim();
if (!token) throw new Error('no GitHub token from `git credential fill`');
const gh = async (method, p, body, headers = {}) => {
  const r = await fetch(p.startsWith('http') ? p : `https://api.github.com${p}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...headers },
    body,
  });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`${method} ${p}: ${r.status} ${await r.text()}`);
  return r.status === 204 ? null : r.json();
};
const json = { 'Content-Type': 'application/json' };
// the "Latest" badge follows the desktop app
const latestFlag = product === 'app' ? 'true' : 'false';
let rel = await gh('GET', `/repos/${REPO}/releases/tags/${tag}`);
if (!rel) {
  rel = await gh('POST', `/repos/${REPO}/releases`, JSON.stringify({ tag_name: tag, target_commitish: BRANCH, name: title, body: notes, draft: false, prerelease: false, make_latest: latestFlag }), json);
  console.log(`created release ${tag}`);
} else {
  rel = await gh('PATCH', `/repos/${REPO}/releases/${rel.id}`, JSON.stringify({ name: title, body: notes, make_latest: latestFlag }), json);
  console.log(`updating release ${tag}`);
}
for (const [name, file] of files) {
  const old = (rel.assets ?? []).find((a) => a.name === name);
  if (old) await gh('DELETE', `/repos/${REPO}/releases/assets/${old.id}`);
  const data = fs.readFileSync(file);
  await gh('POST', `https://uploads.github.com/repos/${REPO}/releases/${rel.id}/assets?name=${encodeURIComponent(name)}`, data, {
    'Content-Type': 'application/octet-stream',
    'Content-Length': String(data.length),
  });
  console.log(`uploaded ${name} (${(data.length / 1048576).toFixed(1)} MB)`);
}

// ── manifest + push ──────────────────────────────────────────────────────────────────────────
writeManifest();
git('add', '--', product, ...(fs.existsSync(path.join(root, 'README.md')) ? ['README.md'] : []));
git('commit', '--quiet', '-m', `${product} v${version}`);
git('push', '--quiet', 'origin', BRANCH);
console.log(`published ${title}: https://github.com/${REPO}/releases/tag/${tag}`);
console.log(`manifest: https://raw.githubusercontent.com/${REPO}/${BRANCH}/${product}/latest.json`);
