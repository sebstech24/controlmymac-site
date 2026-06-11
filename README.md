# Control My Mac Public Site

Public download site for Control My Mac.

This repository is intended to contain only the public marketing site, privacy policy, support page, and public release assets attached through GitHub Releases. It must not contain app source code, signing material, credentials, private configuration, or internal project files.

## Publishing the Mac app later

After the notarized DMG exists, publish it as a GitHub Release asset:

```sh
gh release create v1.0.0 "<path-to>/Mac Remote Control.dmg" --title "Control My Mac 1.0" --notes "Initial public release."
```

Then replace `GITHUB_RELEASE_URL_HERE` in `index.html` with the release asset URL.
