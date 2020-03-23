---
layout: post
title: "Publishing your Flutter App to Google Playstore"
date: 2020-03-23
excerpt: "Steps to build and release your flutter app to playstore"
tag:
  - flutter build release apk
  - flutter build debug apk
  - flutter build command
  - flutter build apk
  - flutter release apk
  - flutter install release apk
  - flutter publish
  - flutter build appbundle
  - flutter build android
  - flutter release android
  - flutter build playstore
  - flutter release playstore
  - flutter app in play store
  - flutter deploy to play store
  - flutter google play store
  - flutter play store release
  - flutter publish to play store
  - flutter upload to play store
  - flutter apps on play store
comments: true
---

## Update App Manifest

Review the default App Manifest file, `AndroidManifest.xml`, located in `<app dir>/android/app/src/main` and verify that the values are correct

[1] Edit the ``android:label`` in the application tag to reflect the final name of the app.

```xml
<application
        android:name="io.flutter.app.FlutterApplication"
        android:label="Covid-19 Tracker"
        android:icon="@mipmap/ic_launcher">
```

[2] Add the required app permissions to the manifest file. For Example, if your app needs internet access then you need to add below permission to your manifest file.

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.rharshad.covid_19_tracker">

    <!-- Add the android.permission.INTERNET permission if your application code needs Internet access -->
    <uses-permission android:name="android.permission.INTERNET"/>

    <application
        android:name="io.flutter.app.FlutterApplication"
        android:label="Covid-19 Tracker"
        android:icon="@mipmap/ic_launcher">
```

## Update Package Identifier

Update your package name as required as it is unique across the app playstore.

Let's say we need the package to be named as `com.rharshad.covid_19_tracker` instead of the default package name given by flutter `com.example.flutter_complete_guide`.

Then, package names need to be updated in below files:

[1]  `AndroidManifest.xml`, located in `<app dir>/android/app/src/main`

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.rharshad.covid_19_tracker">
```

[2] `AndroidManifest.xml`, located in `<app dir>/android/app/src/debug`

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.rharshad.covid_19_tracker">
```

[3] `MainActivity.kt`, located in `<app dir>/android/app/src/main/kotlin/...`

```kotlin
package com.rharshad.covid_19_tracker

import androidx.annotation.NonNull;
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugins.GeneratedPluginRegistrant

class MainActivity: FlutterActivity() {
    override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
        GeneratedPluginRegistrant.registerWith(flutterEngine);
    }
}
```

[4] `applicationId`, located in `<app dir>/android/app/build.gradle`

```gradle
defaultConfig {
  applicationId "com.rharshad.covid_19_tracker"
  minSdkVersion 16
  targetSdkVersion 28
  versionCode flutterVersionCode.toInteger()
  versionName flutterVersionName
  testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
}
```

{% include donate.html %}
{% include advertisement.html %}

## Generate Launcher Icons

`flutter_launcher_icons` package simplifies the task of updating your Flutter app's launcher icon.

Fully flexible, allowing you to choose what platform you wish to update the launcher icon for and if you want, the option to keep your old launcher icon in case you want to revert back sometime in the future.

Update your `pubspec.yaml` with `flutter_launcher_icons` as a `dev dependency`:

```yaml
dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_launcher_icons: ^0.7.4
```

Add the icon path to `pubspec.yaml` file:

```yaml
flutter_icons:
  android: true
  image_path: "images/covid-19-icon.png"
```

Run the command to generate the launcher icons in `<app dir>/android/app/src/main/res` folders.

```bash
$ flutter pub run flutter_launcher_icons:main
Android minSdkVersion = 16
Creating default icons Android
Overwriting the default Android launcher icon with a new icon
```

## Signing the App

To publish on the Play Store, you need to give your app a digital signature.

Get `keytool` path by running `flutter doctor -v` command:

```bash
$ flutter doctor -v

[√] Flutter (Channel stable, v1.12.13+hotfix.8, on Microsoft Windows [Version 10.0.17763.1098], locale en-US)    • Flutter version 1.12.13+hotfix.8 at C:\flutter_windows_v1.12.13+hotfix.8-stable\flutter
    • Framework revision 0b8abb4724 (6 weeks ago), 2020-02-11 11:44:36 -0800
    • Engine revision e1e6ced81d
    • Dart version 2.7.0


[√] Android toolchain - develop for Android devices (Android SDK version 29.0.3)
    • Android SDK at C:\Users\Harshad\AppData\Local\Android\sdk
    • Android NDK location not configured (optional; useful for native profiling support)
    • Platform android-29, build-tools 29.0.3
    • ANDROID_HOME = C:\Users\Harshad\AppData\Local\Android\sdk
    • Java binary at: C:\Program Files\Android\Android Studio\jre\bin\java
    • Java version OpenJDK Runtime Environment (build 1.8.0_212-release-1586-b04)
    • All Android licenses accepted.
```

Keytool will be available at path shown by `Java binary at: ` in the above output.

Create a keystore by running below command:

```text
<keytool_path>/keytool -genkey -v -keystore <keystore_path>/<file_name>.jks -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 -alias key
```

Sample Output:

`Note: Add quotes around space separated names in file paths`

```bash
$ C:\/"Program Files/"\Android\/"Android Studio/"\jre/bin/keytool -genkey -v -keystore c:/Users/Harshad/test.jks -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 -alias key

Enter keystore password:  random
Re-enter new password: random
What is your first and last name?
  [Unknown]:  Harshad Ranganathan
What is the name of your organizational unit?
  [Unknown]:
What is the name of your organization?
  [Unknown]:
What is the name of your City or Locality?
  [Unknown]:
What is the name of your State or Province?
  [Unknown]:
What is the two-letter country code for this unit?
  [Unknown]:
Is CN=Harshad Ranganathan, OU=Unknown, O=Unknown, L=Unknown, ST=Unknown, C=Unknown correct?
  [no]:  yes

Generating 2,048 bit RSA key pair and self-signed certificate (SHA256withRSA) with a validity of 10,000 days
        for: CN=Harshad Ranganathan, OU=Unknown, O=Unknown, L=Unknown, ST=Unknown, C=Unknown
Enter key password for <key>
        (RETURN if same as keystore password):
[Storing c:/Users/Harshad/test.jks]

Warning:
The JKS keystore uses a proprietary format. It is recommended to migrate to PKCS12 which is an industry standard format using "keytool -importkeystore -srckeystore c:/Users/Harshad/test.jks -destkeystore c:/Users/Harshad/test.jks -deststoretype pkcs12".
```

{% include donate.html %}
{% include advertisement.html %}

## Reference the Keystore in the App

Create a file named `<app dir>/android/key.properties` that contains a reference to your keystore:

Give the password, alias & keystore path which you had given earlier to generate the keystore.

```text
storePassword=random
keyPassword=random
keyAlias=key
storeFile=c:/Users/Harshad/key.jks
```

This file should not be checked into source control as the keystore password needs to be private.

Add `key.properties` to your `.gitignore` file inside `<app dir>/android` to exclude the file.

## Configure signing in gradle

Configure signing for your app by editing the `<app dir>/android/app/build.gradle` file.

Add this code before the `android {...}` block:

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Replace the `buildTypes` block with below code:

```gradle
signingConfigs {
  release {
    keyAlias keystoreProperties['keyAlias']
    keyPassword keystoreProperties['keyPassword']
    storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
    storePassword keystoreProperties['storePassword']
  }
}
buildTypes {
  release {
    signingConfig signingConfigs.release
  }
}
```

## Review Build Configuration

[1] Check the `version` in your `pubspec.yaml` file to verify it's correct.

```yaml
version: 1.0.0+1
```

{% include donate.html %}
{% include advertisement.html %}

## Build the App Bundle

Run below command to create the release bundle. 

The release bundle for your app is created at `<app dir>/build/app/outputs/bundle/release/app.aab`.

`Note: R8 is the new code shrinker from Google, and it’s enabled by default when you build a release APK or AAB.`

```bash
$ flutter build appbundle
Running Gradle task 'bundleRelease'...
Running Gradle task 'bundleRelease'... Done                       106.1s
√ Built build\app\outputs\bundle\release\app-release.aab (18.2MB)
```

## Test App Bundle

### Offline

[1] Download `bundletool` jar from <https://github.com/google/bundletool/releases>

[2] Generate apks for your app bundle by running below command:

```bash
java -jar bundletool-all-0.13.3.jar build-apks --bundle=C:/Github/covid_19_tracker/build/app/outputs/bundle/release/app-release.aab \
--output=C:/Github/covid_19_tracker/build/app/outputs/bundle/release/app-release.apks \
--ks=c:/Users/Harshad/key.jks --ks-pass=pass:random --key-pass=pass:random --ks-key-alias=key \
--connected-device
```

where
<!-- prettier-ignore-start -->

|  Param   |   Value  | 
| ----     | ----     |
| --bundle | Path to your app bundle |
| --output | Path to output apks files |
| --ks     | Path to keystore file  |
| --ks-pass=pass: | Keystore password |
| --key-pass=pass: | Password for signing key |
| --connected-device | Instructs bundletool to build APKs that target the configuration of a connected device. |
{:.table-striped}

<!-- prettier-ignore-end -->

[3] Deploy the apks to the connected device.

```bash
java -jar bundletool-all-0.13.3.jar install-apks \
--apks=C:/Github/covid_19_tracker/build/app/outputs/bundle/release/app-release.apks 
```

{% include donate.html %}
{% include advertisement.html %}

## Upload App to Playstore

[1] Sign up for [Google Play Console](https://play.google.com/apps/publish/signup/).

[2] Create a new application by giving a title.

[3] In the `Store Listing` section fill up the mandatory details, upload icons, screenshots, give proper categorization and content ratings.

[4] In the `App releases` section, add your app bundle to the production track and give a release name. 

[5] Before you submit your app for review, fill up the other mandatory sections such as Content rating, App Content and Pricing & Distribution.

Once you submit your app for review it will be pending publication until your app gets reviewed.

## References

<https://flutter.dev/docs/deployment/android>

<https://developer.android.com/studio/command-line/bundletool#generate_apks>