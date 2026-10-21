#!/usr/bin/env bash
# iPhone-only, portrait, permission wording and export-compliance flag for the generated Xcode project.
set -euo pipefail
cd "$(dirname "$0")/.."
P=ios/App/App/Info.plist
PB=/usr/libexec/PlistBuddy
put(){ $PB -c "Delete :$1" "$P" 2>/dev/null || true; $PB -c "Add :$1 $2 $3" "$P"; }
put CFBundleDisplayName string "Face Couture"
put NSCameraUsageDescription string "Face Couture uses your camera so you can take a selfie and style it. Your photos stay on your phone."
put NSPhotoLibraryUsageDescription string "Face Couture opens the photos you choose so you can style them. Your photos stay on your phone."
put NSPhotoLibraryAddUsageDescription string "Face Couture saves your finished photos and reels to your Photos."
put ITSAppUsesNonExemptEncryption bool false
$PB -c "Delete :UISupportedInterfaceOrientations" "$P" 2>/dev/null || true
$PB -c "Add :UISupportedInterfaceOrientations array" "$P"
$PB -c "Add :UISupportedInterfaceOrientations:0 string UIInterfaceOrientationPortrait" "$P"
$PB -c "Delete :UISupportedInterfaceOrientations~ipad" "$P" 2>/dev/null || true
PJ=ios/App/App.xcodeproj/project.pbxproj
sed -i '' 's/TARGETED_DEVICE_FAMILY = "1,2";/TARGETED_DEVICE_FAMILY = 1;/g' "$PJ"
grep -q 'TARGETED_DEVICE_FAMILY = 1;' "$PJ" || echo "warning: device family not set"
echo "iOS project configured"
