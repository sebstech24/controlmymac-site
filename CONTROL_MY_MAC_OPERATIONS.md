# Control My Mac release, subscriber email, codes, and notifications

Last verified: 20 September 2026

This is the canonical map for the current Control My Mac launch work. It records what exists, where it lives, what is already live, and the exact remaining activation steps. Never paste secret values or real offer codes into this file or Git.

## Current truth at a glance

| Area | Current state | Location |
|---|---|---|
| App Store build | Version 1.2 build 19 was uploaded and submitted on 19 September 2026. The release worktree notes say `Ready for Review`. | `cmm-custom-grid/FAST_TAP_CHANGELOG.md` |
| Build 19 code redemption | Available from the paywall through Apple's system offer-code sheet. The same code can also be entered in Apple's App Store redemption UI. | `cmm-custom-grid/native/MacRemoteControlPhone/.../PaywallView.swift` |
| Settings redemption shortcut | Implemented on `mac-remote-control` `main` at commit `383f026`, after build 19 was uploaded. It is not in the already-uploaded build 19 binary. | `Swoip-claude/native/MacRemoteControlPhone/.../SettingsRootView.swift` |
| Update-notification prompt | Implemented on `mac-remote-control` `main`. | `.../Monetization/UpdateNotifications.swift` |
| Remote push delivery | App registration, encrypted token storage, and an authenticated APNs sender are implemented in source. Apple capability/key, database migration, Vercel secrets, next-build integration, and a real-device test are still required. | iOS repo plus this website repo |
| Subscriber gift email | One localized email with a manual free-month code, in-app instructions, confirmation link, and unsubscribe link. No lifetime offer or follow-up offer exists. | `api/_lib/email-content.js` |
| Public gift form | The visual prototype works locally. The production website is not connected to the code API. | local prototype and `assets/site.js` |
| Production code delivery | Safely disabled. `GET /api/request-code` reports `configured: false`. No production code inventory has been approved for sending. | Vercel environment |

## Repositories and deployments

### iPhone/iPad app main repository

- Local: `/Users/sebastianskoic/Coding/Fable stuff/Swoip-claude/native/MacRemoteControlPhone`
- GitHub: `https://github.com/sebstech24/mac-remote-control.git`
- Branch: `main`
- Current pushed commit containing the APNs completion work: `cd2f650`
- Bundle ID: `com.sebastianskoic.macremotecontrol.phone`
- Apple team ID: `H9ZS6Y55PD`
- Important: this checkout still declares version 1.1 build 12. Do not archive it as build 19 without first reconciling it with the actual 1.2 release branch.

### Actual build 19 release worktree

- Local: `/Users/sebastianskoic/Coding/Fable stuff/cmm-custom-grid`
- Branch: `feature/custom-grid`
- The worktree contains uncommitted release work and must not be overwritten or bulk-checked out.
- Archive recorded in the release notes: `~/Library/Developer/Xcode/Archives/2026-09-19/Control My Mac 1.2 (19).xcarchive`
- Build 19 is immutable after upload. Any new binary must use build 20 or higher.

### Website and backend

- Local: `/Users/sebastianskoic/Coding/Fable stuff/controlmymac-site`
- GitHub: `https://github.com/sebstech24/controlmymac-site.git`
- Vercel project: `controlmymac-site`
- Vercel project ID: `prj_jqyqJTPw8ENwY1u7jYFteTAQWF5I`
- Current pushed website/backend commit: `f0a2a7c`
- Production site: `https://controlmymac.com`
- Database schema: `db/code-delivery.sql`
- Environment-variable template: `.env.example`

## How a person can redeem a free-month code

Build 19 already supports a valid Apple offer code in these ways:

1. Open Control My Mac, open the Full App paywall, choose **Redeem Offer Code**, and enter the code in Apple's system sheet.
2. Open the App Store, open the Apple Account menu, choose **Redeem Gift Card or Code**, and enter the code manually.
3. Apple-generated batches can include unique redemption URLs. The current email intentionally does not use those links because the approved flow tells the person exactly where to enter the code in the app.

The later app source adds a second in-app entrance at **Control My Mac → Settings → Mode → Redeem Offer Code**. That shortcut requires a new uploaded build.

## Subscriber welcome-gift flow

The intended flow is:

1. A visitor opens the desktop website and selects the required Sebastian Apps email opt-in.
2. Cloudflare Turnstile blocks basic automated abuse.
3. `/api/request-code` normalizes and hashes the address, encrypts the address, records the consent version, and atomically assigns one unused Apple code.
4. Brevo sends exactly one immediate email. The message shows the code as text and explains **Control My Mac → Settings → Mode → Redeem Offer Code**.
5. The email includes a separate confirmation link for future Sebastian Apps emails. Only that click adds the address to the ongoing Brevo marketing list.
6. Every future marketing email must include an unsubscribe path. Unsubscribing does not invalidate an already-sent Apple code.

There is no lifetime discount, lifetime timer, scheduled follow-up offer, or promotional push notification.

### Data and secrets

- Neon stores encrypted email addresses and offer codes, keyed hashes for lookup, consent timestamps, delivery state, and unsubscribe state.
- Brevo delivers the transactional code email and stores only confirmed newsletter contacts in the selected list.
- Cloudflare Turnstile verifies the public request before code assignment.
- Vercel runs the API and stores server-side environment secrets.
- Secret names are listed in `.env.example`. Their values belong only in Vercel or an untracked local environment file.

## Update-notification architecture

Notifications are for short summaries of new features, improvements, and important Control My Mac updates only.

1. The app shows its explanatory primer.
2. If the person continues, iOS shows the system permission dialog.
3. After permission is granted, the app registers with APNs.
4. Apple returns an opaque device token. The app sends it with a random installation UUID, locale, app version, and APNs environment to `/api/notifications/register`.
5. The backend stores a keyed hash and encrypted token. It does not associate the token with an email address, Apple Account, device name, or remote-control activity.
6. The authenticated `/api/admin/send-update-notification` endpoint sends an alert through APNs. Invalid or unregistered tokens are disabled automatically.
7. The app shows alerts even while it is in the foreground.

The server starts with `PUSH_REGISTRATION_MODE=disabled`. This fail-closed setting prevents accidental token collection before the privacy and Apple configuration are ready.

## Exact activation checklist

### A. Reconcile the next app build

- [ ] Let Apple finish review of build 19, or deliberately withdraw it if a replacement is required.
- [ ] Preserve the dirty `cmm-custom-grid` release worktree.
- [ ] Integrate the Settings redemption shortcut, review prompt, notification primer, APNs registrar, app delegate, and entitlements from `mac-remote-control/main` into the real 1.2 release line by reviewing individual diffs.
- [ ] Resolve the next available App Store build number. Since 19 has already been uploaded, use 20 or higher.
- [ ] Confirm both in-app redemption entrances: paywall and **Settings → Mode**.

### B. Enable Apple Push Notification service

- [ ] In Apple Developer, open **Certificates, Identifiers & Profiles → Identifiers → `com.sebastianskoic.macremotecontrol.phone`** and enable **Push Notifications**.
- [ ] Regenerate/download the development and App Store provisioning profiles if Xcode automatic signing does not refresh them.
- [ ] In **Keys**, create an APNs signing key. Record the Key ID and download the `.p8` file immediately; Apple allows downloading it only once.
- [ ] Do not commit the `.p8` file. Put its full PEM text into Vercel as `APNS_PRIVATE_KEY`.
- [ ] Set `APNS_KEY_ID`, `APNS_TEAM_ID=H9ZS6Y55PD`, and `APNS_BUNDLE_ID=com.sebastianskoic.macremotecontrol.phone` in Vercel Production and the chosen Preview environment.

### C. Prepare the database and Vercel

- [ ] Run the current `db/code-delivery.sql` against the existing dedicated Neon database. It is idempotent and adds `push_devices` plus its indexes.
- [ ] Confirm `DATABASE_URL`, `EMAIL_HASH_SECRET`, and `CODE_ENCRYPTION_KEY` already exist in the same Vercel environment. Do not generate replacements if records already exist, because replacement keys would make existing encrypted values unreadable.
- [ ] Keep `PUSH_REGISTRATION_MODE=disabled` until a new physical-device build is installed.
- [ ] Deploy the website/backend and verify `GET https://controlmymac.com/api/notifications/register` returns `{"configured":false}`.
- [ ] Change `PUSH_REGISTRATION_MODE` to `ready`, redeploy, and confirm the same endpoint returns `{"configured":true}`.

### D. Privacy and App Store declarations

- [ ] Publish the updated `/privacy` page before enabling token collection.
- [ ] In App Store Connect App Privacy, review and update the declaration for the APNs token/random installation identifier under **Identifiers / Device ID**, used for **App Functionality**, with no tracking. Answer Apple's linked-to-user question based on the final implementation and current Apple definitions.
- [ ] Confirm the notification wording still promises only product updates, not promotions.

### E. Test on a physical device

- [ ] Install a development build on an iPhone or iPad. Push tokens are not meaningfully testable in the simulator for this release check.
- [ ] Accept the in-app primer and then accept Apple's system permission dialog.
- [ ] Confirm one enabled `sandbox` row appears in `push_devices`, without printing or copying the decrypted token.
- [ ] Send a sandbox notification with the authenticated command below and confirm it appears with the app closed, backgrounded, and foregrounded.
- [ ] Install the TestFlight/App Store build and repeat against the `production` APNs environment.
- [ ] Turn notifications off in iOS Settings and confirm no alert is displayed.

Example authenticated send command. Supply secrets locally; never paste them into Git or shell history shared with others:

```sh
curl -X POST 'https://controlmymac.com/api/admin/send-update-notification' \
  -H "Authorization: Bearer $CONTROL_MY_MAC_ADMIN_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"title":"Control My Mac 1.3","body":"A concise summary of the new feature and improvement.","version":"1.3","url":"https://controlmymac.com"}'
```

The response reports `attempted`, `delivered`, `disabled`, and `failed`. A 401 means the admin key is missing/wrong. A 503 means notification mode or a required APNs secret is not ready.

### F. Finish and activate subscriber email

- [ ] Create/import a production batch of valid one-time Apple offer codes with an expiry date that leaves a safe redemption window.
- [ ] Verify the current subscription offer behavior in App Store Connect, including whether it auto-renews and who is eligible. Set `FREE_MONTH_AUTO_RENEWS` so the email says the truth.
- [ ] Keep `BREVO_SANDBOX_MODE=true` for a final contract test, then use `false` for a controlled real-inbox test.
- [ ] Test a real address end-to-end: receipt location, spam placement, code text, instructions, confirmation, Brevo list membership, unsubscribe, and duplicate submission.
- [ ] Confirm all 13 localized email variants render without missing text.
- [ ] Connect the approved visible website form to `/api/request-code` only after the real-inbox test passes.
- [ ] Set `CODE_DELIVERY_MODE=ready` only after production inventory exists and the public form is ready. It remains a separate switch from push notifications.
- [ ] Verify the first public request, then watch Neon inventory and Brevo delivery events without exposing code values in logs.

## Tests and useful commands

Website/backend:

```sh
cd '/Users/sebastianskoic/Coding/Fable stuff/controlmymac-site'
npm test
```

iPhone/iPad compile check:

```sh
cd '/Users/sebastianskoic/Coding/Fable stuff/Swoip-claude/native/MacRemoteControlPhone'
xcodebuild -project MacRemoteControlPhone.xcodeproj \
  -scheme MacRemoteControlPhone \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  CODE_SIGNING_ALLOWED=NO build
```

## Safe rollback

- Set `PUSH_REGISTRATION_MODE=disabled` and redeploy to stop new token registration and sending.
- Set `CODE_DELIVERY_MODE=disabled` and redeploy to stop code assignment and email sending.
- Do not delete encrypted records during an incident. Preserve them until the problem is understood, then use a targeted, reviewed deletion query.
- Never rotate `CODE_ENCRYPTION_KEY` or `EMAIL_HASH_SECRET` without a migration plan.
- Never reuse an Apple offer code or put codes in application logs.

## Known blockers before everything is live

1. Build 19 is already uploaded; notification delivery and the Settings redemption shortcut require build 20 or higher.
2. The APNs capability, key, and provisioning must be configured in Apple Developer.
3. The push database migration and Vercel APNs secrets must be applied.
4. A physical-device sandbox and production push test must pass.
5. Real production Apple offer codes must exist and be imported.
6. The subscriber form must pass a controlled real-email test before it is connected publicly.
