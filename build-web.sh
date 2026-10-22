#!/bin/sh
# Copies www/ to docs/ (GitHub Pages) and adds a strict CSP + hides nothing else. The APK uses www/ as is.
set -e
cd "$(dirname "$0")"
rm -rf docs && mkdir docs && cp www/* docs/
CSP="<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'\">"
sed -i "s#<meta charset=\"utf-8\">#<meta charset=\"utf-8\">$CSP#" docs/index.html docs/privacy.html
# Web version allows pinch zoom (accessibility). The Android app keeps zoom locked.
sed -i 's#maximum-scale=1,user-scalable=no,##' docs/index.html
