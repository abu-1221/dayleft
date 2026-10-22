# DayLeft

Daily budget tracker. Monthly income minus fixed bills, divided by 30, is your budget for each day. Add spends through the day and see what is left.

- Web (PWA, works offline): https://abu-1221.github.io/dayleft/
- Android APK: see Releases. It has no internet permission, so nothing can leave the phone.
- Android extras: 9:30 PM night summary notification, and debit SMS (UPI/bank) are read on the phone and added to Today.
- Free only. No accounts, no analytics, no servers. Data stays in the app (local storage). Export/import a .json backup in Settings.

## Build
`www/` is the whole app. `npx cap sync android`, then `cd android && ./gradlew assembleRelease` (set `KS` and `KP` for your keystore). Native code is in `android/app/src/main/java/com/abu/dayleft/`.
