set -x
mkdir -p out
curl -sL -o dayleft.apk https://github.com/abu-1221/dayleft/releases/download/v0.1/DayLeft-v0.1.apk
adb install dayleft.apk
adb shell pm grant com.abu.dayleft android.permission.RECEIVE_SMS
adb shell pm grant com.abu.dayleft android.permission.POST_NOTIFICATIONS
shot(){ adb exec-out screencap -p > out/$1.png; }
adb shell monkey -p com.abu.dayleft -c android.intent.category.LAUNCHER 1; sleep 8; shot 1-setup
adb shell input tap 540 484; sleep 1; adb shell input text 30000; sleep 1
adb shell input keyevent 61; sleep 1; adb shell input text 6000; sleep 1; shot 2-typed
adb shell input keyevent 4; sleep 1; adb shell input tap 540 852; sleep 2; shot 3-today
adb shell input keyevent 3; sleep 2
adb emu sms send 56789 "Rs.250.00 debited from A/c XX1234 to SWIGGY via UPI. Ref 12345"; sleep 3
adb emu sms send 56789 "Rs.5000.00 credited to your account from RAVI"; sleep 2
adb shell am broadcast -n com.abu.dayleft/.Night; sleep 3
adb shell dumpsys notification --noredact | grep -E "Left today|Spent|Over budget" > out/notif.txt
adb shell cmd statusbar expand-notifications; sleep 2; shot 4-notification
adb shell cmd statusbar collapse; sleep 1
adb shell monkey -p com.abu.dayleft -c android.intent.category.LAUNCHER 1; sleep 5; shot 5-after-sms
adb shell run-as com.abu.dayleft ls 2>&1 | head -3 > out/runas.txt || true
adb logcat -d | grep -iE "AndroidRuntime|dayleft" | tail -30 > out/log.txt
