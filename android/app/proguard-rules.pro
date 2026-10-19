# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:
-keep class com.babyboo.app.BabyBooWidgetProvider { *; }

# Preserve BabyBoo core activities, services, receivers, and controller components
-keep class com.babyboo.app.** { *; }
-keepclassmembers class com.babyboo.app.** { *; }

# Preserve Handover native package
-keep class com.babyboo.handover.** { *; }
-keepclassmembers class com.babyboo.handover.** { *; }
