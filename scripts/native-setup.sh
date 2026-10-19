#!/usr/bin/env bash
# Native settings applied after `npx cap add ios|android` (icons, splash, permissions, orientation).
set -euo pipefail
PLATFORM="$1"
npx --yes @capacitor/assets generate --"$PLATFORM" \
  --iconBackgroundColor '#2b1636' --iconBackgroundColorDark '#2b1636' \
  --splashBackgroundColor '#2b1636' --splashBackgroundColorDark '#2b1636'

if [ "$PLATFORM" = "ios" ]; then
  PL=ios/App/App/Info.plist
  pb() { /usr/libexec/PlistBuddy -c "$1" "$PL" 2>/dev/null || true; }
  setstr() { pb "Delete :$1"; pb "Add :$1 string $2"; }
  setstr NSCameraUsageDescription "Face Couture uses the camera so you can take a selfie to edit. Photos stay on your phone."
  setstr NSPhotoLibraryUsageDescription "Face Couture opens the photo you choose so you can edit it. Photos stay on your phone."
  setstr NSPhotoLibraryAddUsageDescription "Face Couture saves your finished photos and videos to your Photos."
  setstr CFBundleDisplayName "Face Couture"
  pb "Delete :ITSAppUsesNonExemptEncryption"; pb "Add :ITSAppUsesNonExemptEncryption bool false"
  pb "Delete :UIRequiresFullScreen"; pb "Add :UIRequiresFullScreen bool true"
  pb "Delete :UISupportedInterfaceOrientations"; pb "Add :UISupportedInterfaceOrientations array"; pb "Add :UISupportedInterfaceOrientations:0 string UIInterfaceOrientationPortrait"
  pb "Delete :UIStatusBarStyle"; pb "Add :UIStatusBarStyle string UIStatusBarStyleDarkContent"
  pb "Delete :UIViewControllerBasedStatusBarAppearance"; pb "Add :UIViewControllerBasedStatusBarAppearance bool true"
  # iPhone app (iPad runs it in iPhone mode)
  sed -i '' 's/TARGETED_DEVICE_FAMILY = "1,2";/TARGETED_DEVICE_FAMILY = 1;/g' ios/App/App.xcodeproj/project.pbxproj
  if [ -n "${APP_VERSION:-}" ]; then
    sed -i '' "s/MARKETING_VERSION = [^;]*;/MARKETING_VERSION = ${APP_VERSION};/g; s/CURRENT_PROJECT_VERSION = [^;]*;/CURRENT_PROJECT_VERSION = ${BUILD_NUMBER:-1};/g" ios/App/App.xcodeproj/project.pbxproj
  fi
  echo "iOS Info.plist:"; cat "$PL"
fi

if [ "$PLATFORM" = "android" ]; then
  MF=android/app/src/main/AndroidManifest.xml
  # portrait phone editor
  sed -i 's/android:name=".MainActivity"/android:name=".MainActivity"\n            android:screenOrientation="portrait"/' "$MF"
  GR=android/app/build.gradle
  if [ -n "${APP_VERSION:-}" ]; then
    sed -i "s/versionCode [0-9]*/versionCode ${BUILD_NUMBER:-1}/; s/versionName \"[^\"]*\"/versionName \"${APP_VERSION}\"/" "$GR"
  fi
  echo "AndroidManifest:"; cat "$MF"
fi
