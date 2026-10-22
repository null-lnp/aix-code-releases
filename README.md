# Aix Code releases

Releases of **Aix Code**, the desktop app, and the **aix CLI**, the terminal coding agent. The
source repositories are private. This public repository holds the installers, the binaries and the
update manifests both apps read.

## Latest versions

<!-- latest:start -->
| Product | Version | Released | Downloads |
| --- | --- | --- | --- |
| Aix Code | [0.17.0](https://github.com/null-lnp/aix-code-releases/releases/tag/app-v0.17.0) | 2026-10-22 | [aix-code-0.17.0-x64-setup.exe](https://github.com/null-lnp/aix-code-releases/releases/download/app-v0.17.0/aix-code-0.17.0-x64-setup.exe) · [aix-code-0.17.0-x64.msi](https://github.com/null-lnp/aix-code-releases/releases/download/app-v0.17.0/aix-code-0.17.0-x64.msi) |
| aix CLI | [2.19.0](https://github.com/null-lnp/aix-code-releases/releases/tag/cli-v2.19.0) | 2026-10-22 | [aix-2.19.0-windows-x86_64.exe](https://github.com/null-lnp/aix-code-releases/releases/download/cli-v2.19.0/aix-2.19.0-windows-x86_64.exe) |
<!-- latest:end -->

## Install

- **Aix Code (Windows):** download `aix-code-<version>-x64-setup.exe` (or the `.msi`) from the
  [latest app release](https://github.com/null-lnp/aix-code-releases/releases?q=app-v&expanded=true)
  and run it. The app updates itself from then on.
- **aix CLI (Windows):** download `aix-<version>-windows-x86_64.exe` from the
  [latest CLI release](https://github.com/null-lnp/aix-code-releases/releases?q=cli-v&expanded=true),
  rename it to `aix.exe` and put it on your `PATH`. `aix update` keeps it current.

## How updates work

| | Manifest | Release tags |
| --- | --- | --- |
| Aix Code | [`app/latest.json`](app/latest.json), read by the Tauri updater | `app-vX.Y.Z` |
| aix CLI | [`cli/latest.json`](cli/latest.json), read by `aix update` and the startup check | `cli-vX.Y.Z` |

- The apps read the manifests from
  `https://raw.githubusercontent.com/null-lnp/aix-code-releases/main/<product>/latest.json`.
- Each manifest lists the newest version, its release notes and one download per platform. Every
  download has a minisign signature and a SHA-256 hash.
- Every download is signed with the aix release key. The apps check the signature against the
  public key built into them and refuse anything else.
- `app/CHANGELOG.md` and `cli/CHANGELOG.md` are copies of each product's changelog.

## Publishing (maintainers)

The release scripts of both source repos run [`publish.mjs`](publish.mjs). It creates the tagged
release, uploads the signed assets, rewrites `<product>/latest.json` and the changelog, and pushes
this repository:

```powershell
# Aix Code: after the signed `tauri build`
node scripts/release.mjs          # in aix-code-app
# aix CLI: builds, signs and publishes aix.exe
node scripts/release.mjs          # in aix-cli
```

Then it mirrors the release into the product's own source repository (`vX.Y.Z` in
null-lnp/aix-code-app or null-lnp/aix-cli, marked Latest, the same assets) with
[`mirror.mjs`](mirror.mjs), and the release scripts finish with [`status.mjs`](status.mjs), which
checks that the latest version is everywhere: the source clone, the manifest, the public release
and the source repository's Latest release.

```powershell
node status.mjs                                               # what lags behind, if anything
node mirror.mjs --product app --version 0.8.1 --commit <sha>  # repair or backfill a mirror
```

Don't edit the manifests by hand.
