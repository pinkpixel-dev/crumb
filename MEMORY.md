# Project memory

## September 2, 2026: Manual Windows release workflow

### What was decided

Crumb uses a manually activated GitHub Actions workflow for Windows releases. The workflow builds one unsigned 64-bit NSIS installer and uploads it to an existing GitHub Release.

The workflow requires a release tag as input. It checks out that tag, checks its version against `package.json`, and stops if the matching release does not exist.

### Why

Release creation stays a deliberate manual step. The workflow handles only the slow Windows build and asset upload.

The NSIS installer gives Windows users one direct `setup.exe` download. Asset replacement also makes a failed or interrupted release build safe to run again.

### What was rejected and why

- Building both NSIS and MSI was rejected because one installer is enough for the current release.
- Automatic release creation was rejected because the workflow must attach its installer to a release that already exists.
- Code signing was deferred because no Windows signing certificate is configured.
