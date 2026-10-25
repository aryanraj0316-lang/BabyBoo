# Final Architecture Plan: Blackout Screen, Lock Screen Wake & Battery-Low Signal

## 1. Executive Summary & Problem Context
BabyBoo simulates a natural "battery died" scenario to help parents peacefully end screen time for toddlers without tantrums.

### The Ambiguity Problem
1. When BabyBoo enters simulated blackout, the display dims to its lowest edge (`0.004f`) and renders pure black (`#000000`). To human eyes, the device appears completely off.
2. If the parent or child presses the physical **Power button**, the device hardware turns off the display (`Screen OFF`) and arms the Android OS Lock Screen (Keyguard).
3. Because an off screen and a simulated blackout screen look identical, parents could not tell whether the phone was awake (accepting the free-form capital "A" swipe) or asleep.
4. Furthermore, on previous builds, when the screen was turned back on, the Android System Lock Screen swallowed all touches because floating application overlays cannot intercept touches over Keyguard.

### The Solution
* **Zero Accessibility Dependency:** Completely remove `BlackoutAccessibilityService` and `TYPE_ACCESSIBILITY_OVERLAY`. Use Android's native `Immersive Sticky Mode` (`BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE`) to keep system bars completely hidden without needing high-risk accessibility permissions or complex setup.
* **Lock Screen Bypass (`showWhenLocked` + `turnScreenOn`):** When the power button wakes the device, `ScreenTimeBackgroundService` catches `Intent.ACTION_SCREEN_ON` and brings `ShutdownSimulationActivity` immediately on top of the Lock Screen.
* **Authentic 1-Second Battery-Dead Animation & Brightness Pulse:**
  When woken up by the power button, the screen momentarily increases brightness and displays the realistic 0% critical battery icon for ~1.2 seconds before smoothly fading to black and dimming back down to `0.004f`.
  * **To the child:** Looks like a real phone (iPhone/Pixel/Samsung) that is completely dead and refuses to boot.
  * **To the parent:** Confirms with 100% certainty that the screen is awake and now actively waiting for the capital "A" unlock swipe.
* **Ultra-Faint Touch Haptic Feedback:** Touching or swiping on the screen in blackout mode generates an ultra-faint tactile tick (`VibrationEffect.EFFECT_TICK` or an 8ms micro-pulse), giving silent tactile confirmation that the digitizer is awake.

---

## 2. Sequence Diagram: Wake & Unlock Flow

```mermaid
sequenceDiagram
    autonumber
    actor Parent as Parent / Toddler
    participant HW as Hardware Power Button
    participant OS as Android OS (Keyguard)
    participant Svc as ScreenTimeBackgroundService
    participant Act as ShutdownSimulationActivity
    participant View as ShutdownSimulationView

    Note over Parent,View: Phone is in blackout (screen asleep or locked)
    Parent->>HW: Presses Power Button
    HW->>OS: Device Wakes Up
    OS->>Svc: Broadcast Intent.ACTION_SCREEN_ON
    Svc->>Act: Launch Activity (FLAG_ACTIVITY_NEW_TASK, showWhenLocked)
    Act->>OS: setShowWhenLocked(true), setTurnScreenOn(true)
    Note over OS,Act: Activity displays DIRECTLY ABOVE Lock Screen
    Act->>View: triggerWakeBatterySignal()
    View->>Act: Temporarily raise window brightness (0.35f)
    View->>View: Show 0% Battery Warning Icon (~1.2s)
    Note over Parent: Toddler convinced phone is dead; Parent knows digitizer is active
    View->>View: Smooth fade out (alpha 0)
    View->>Act: Restore window brightness to lowest (0.004f)
    Parent->>View: Touches / Swipes "A"
    View->>Parent: Ultra-faint haptic tick (8ms / EFFECT_TICK)
    View->>View: Capital "A" Recognized
    View->>Act: onUnlocked()
    Act->>OS: KeyguardManager.requestDismissKeyguard()
    Act->>Svc: ACTION_SIMULATION_FINISHED
    Note over OS: Phone unlocked; normal home screen restored
```

---

## 3. Detailed Component Architecture

### A. Removal of `BlackoutAccessibilityService`
* **What is removed:**
  * `BlackoutAccessibilityService.kt`
  * Accessibility service declarations and intent filters in `AndroidManifest.xml`
  * Accessibility disclosure prompts in `WidgetPopupActivity.kt`
* **Why this is better:**
  * Standard `Activity` with `systemUiVisibility` / `WindowInsetsController` hides the status bar and navigation bar completely.
  * Full Google Play Store compliance (no risk of rejection for misuse of Accessibility APIs).
  * Setup barrier reduced from 2 system permission screens to 1 simple "Display Over Other Apps" toggle (or zero if using pure fullscreen activity).

### B. `ShutdownSimulationActivity` (Lock Screen Host)
* Configured in `AndroidManifest.xml` with:
  * `android:showWhenLocked="true"`
  * `android:turnScreenOn="true"`
  * `android:theme="@android:style/Theme.Black.NoTitleBar.Fullscreen"`
* In `onCreate` and `onResume`:
  * Sets `window.attributes.screenBrightness = 0.004f` for blackout.
  * Provides `setBrightness(float)` callback to `ShutdownSimulationView` for the momentary wake brightness pulse.
  * Handles `onNewIntent` to trigger `wakeBatterySignal()` whenever the screen is turned on.

### C. `ShutdownSimulationView` (UI & Gesture Engine)
* **Battery-Dead Wake Cue:**
  * Displays `BatteryIconView` at `0%` level with exclamation mark and "Battery critically low" for 1.2 seconds.
  * Requests brightness boost to `0.35f`, then decelerates alpha to `0` and restores brightness to `0.004f`.
* **Ultra-Faint Haptic Feedback:**
  * Uses `VibrationEffect.createPredefined(VibrationEffect.EFFECT_TICK)` (Android 10+) or `VibrationEffect.createOneShot(8, 25)` / 8ms fallback.
  * Emits micro-ticks on initial finger down and stroke movement, providing silent haptic confirmation without loud buzzing.
* **Invisible Canvas & Strict 'A' Detection:**
  * Full-screen invisible `SwipeCanvasView` capturing dual legs + mandatory horizontal crossbar.

### D. `ScreenTimeBackgroundService` (State & Screen Monitor)
* Maintains dynamic `BroadcastReceiver` for `Intent.ACTION_SCREEN_ON` and `Intent.ACTION_SCREEN_OFF`.
* When `ACTION_SCREEN_ON` fires while `SimulationController.isActive()` is true:
  * Immediately launches/brings `ShutdownSimulationActivity` to the top.
  * Ensures the activity covers Keyguard before the system lock keypad is interacted with.

---

## 4. Verification & Validation Steps
1. **Countdown Expiry to Blackout:** Verify smooth transition 4% -> 3% -> 2% -> 1% -> 0% -> Pitch Black.
2. **Power Button Press (Screen Off):** Press power button to sleep display. Verify display shuts off.
3. **Power Button Press (Screen On):** Press power button to wake display. Verify:
   * `ShutdownSimulationActivity` appears above Lock Screen.
   * Brightness pulses momentarily, showing the 0% battery icon for ~1.2s.
   * Icon smoothly fades to black, brightness returns to lowest edge (`0.004f`).
4. **Haptic Touch:** Touch glass and feel the ultra-faint micro-tick.
5. **Swipe 'A' Unlock:** Swipe a capital "A" freehand (one to three strokes, no dot grid). Verify device unlocks cleanly and returns to the home screen.
