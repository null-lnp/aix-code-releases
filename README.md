# aix Code releases

Releases of **aix Code**, the desktop app, and the **aix CLI**, the terminal coding agent. The
source repositories are private. This public repository holds the installers, the binaries and the
update manifests both apps read.

## Latest versions

<!-- latest:start -->
| Product | Version | Released | Downloads |
| --- | --- | --- | --- |
| aix Code | [0.7.0](https://github.com/null-lnp/aix-code-releases/releases/tag/app-v0.7.0) | 2026-10-16 | [aix-code-0.7.0-x64-setup.exe](https://github.com/null-lnp/aix-code-releases/releases/download/app-v0.7.0/aix-code-0.7.0-x64-setup.exe) · [aix-code-0.7.0-x64.msi](https://github.com/null-lnp/aix-code-releases/releases/download/app-v0.7.0/aix-code-0.7.0-x64.msi) |
| aix CLI | [2.11.0](https://github.com/null-lnp/aix-code-releases/releases/tag/cli-v2.11.0) | 2026-10-16 | [aix-2.11.0-windows-x86_64.exe](https://github.com/null-lnp/aix-code-releases/releases/download/cli-v2.11.0/aix-2.11.0-windows-x86_64.exe) |
<!-- latest:end -->

## Install

- **aix Code (Windows):** download `aix-code-<version>-x64-setup.exe` (or the `.msi`) from the
  [latest app release](https://github.com/null-lnp/aix-code-releases/releases?q=app-v&expanded=true)
  and run it. The app updates itself from then on.
- **aix CLI (Windows):** download `aix-<version>-windows-x86_64.exe` from the
  [latest CLI release](https://github.com/null-lnp/aix-code-releases/releases?q=cli-v&expanded=true),
  rename it to `aix.exe` and put it on your `PATH`. `aix update` keeps it current.

## How updates work

| | Manifest | Release tags |
| --- | --- | --- |
| aix Code | [`app/latest.json`](app/latest.json), read by the Tauri updater | `app-vX.Y.Z` |
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
# aix Code: after the signed `tauri build`
node scripts/release.mjs          # in aix-code-app
# aix CLI: builds, signs and publishes aix.exe
node scripts/release.mjs          # in aix-cli
```

Don't edit the manifests by hand.
