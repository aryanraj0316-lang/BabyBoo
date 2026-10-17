import ExpoModulesCore

public class HandoverNativeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("HandoverNative")

    Events("onHandoverStateChange")

    AsyncFunction("helloWorld") {
      return "HandoverNative iOS (Unsupported Stub)"
    }

    AsyncFunction("getState") {
      return [
        "status": "IDLE",
        "endAt": 0,
        "graceEndAt": 0
      ]
    }

    AsyncFunction("startSession") { (_: [String: Any]) in
      return [
        "status": "IDLE",
        "endAt": 0,
        "graceEndAt": 0
      ]
    }

    AsyncFunction("cancelSession") {
      return [
        "status": "IDLE",
        "endAt": 0,
        "graceEndAt": 0
      ]
    }

    AsyncFunction("setPin") { (_: String) -> Bool in
      return false
    }

    AsyncFunction("verifyPin") { (_: String) -> Bool in
      return false
    }

    AsyncFunction("getPermissionStatus") {
      return [
        "overlayGranted": false,
        "notificationsGranted": false,
        "exactAlarmsGranted": false,
        "batteryOptimizationIgnored": false
      ]
    }

    AsyncFunction("openPermissionSettings") { (_: String) in
      // iOS safe no-op stub
    }
  }
}
