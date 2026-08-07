# TrainFlow mobile app shell

Capacitor wrapper around the production deployment (`https://trainflow-chi.vercel.app`). No native code — this is a WebView shell, so any change to the live site appears in the app immediately with no rebuild needed.

## What's here

- `capacitor.config.ts` — app identity (`com.trainflow.app` / "TrainFlow") and the remote URL it loads
- `ios/` — Xcode project. Open `ios/App/App.xcodeproj` in Xcode on a Mac.
- `android/` — Gradle project. Open `android/` in Android Studio.
- `assets/logo.png` — source icon (1536×1536, transparent) used to generate all icon/splash sizes

## To build and submit

**iOS** (requires a Mac with Xcode):
1. Open `apps/mobile/ios/App/App.xcodeproj` in Xcode (this project uses Swift Package Manager, not CocoaPods — no `pod install` step needed; Xcode resolves the Swift package automatically on first open)
2. Set your Apple Developer team under Signing & Capabilities
3. Product → Archive, then follow Xcode's App Store Connect submission flow
4. Requires an active Apple Developer Program membership ($99/yr)

**Android** (requires Android Studio):
1. Open `apps/mobile/android` in Android Studio and let it sync
2. Build → Generate Signed Bundle/APK
3. Upload the resulting `.aab` to Google Play Console
4. Requires a Google Play Console account ($25 one-time)

## Regenerating icons

If the brand mark changes, replace `assets/logo.png` (keep it square, at least 1024×1024, with transparency) and re-run from `apps/mobile`:

```bash
npx capacitor-assets generate --ios --android --iconBackgroundColor "#0c0e0d" --iconBackgroundColorDark "#0c0e0d" --splashBackgroundColor "#0c0e0d" --splashBackgroundColorDark "#0c0e0d"
npx cap sync
```
