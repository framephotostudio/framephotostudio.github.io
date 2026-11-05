// App Shortcut: "Make a Platform Pack" (Shortcuts, Spotlight and Siri) opens Face Couture on Platform Pack.
import AppIntents
import UIKit

@available(iOS 16.0, *)
struct MakePlatformPackIntent: AppIntent {
    static var title: LocalizedStringResource = "Make a Platform Pack"
    static var description = IntentDescription("Open Face Couture on Platform Pack: one photo, every platform size, framed on your face.")
    static var openAppWhenRun: Bool = true

    @MainActor
    func perform() async throws -> some IntentResult {
        if let url = URL(string: "facecouture://pack") {
            _ = await UIApplication.shared.open(url)
        }
        return .result()
    }
}

@available(iOS 16.0, *)
struct FaceCoutureShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(intent: MakePlatformPackIntent(),
                    phrases: ["Make a Platform Pack in \(.applicationName)", "Open Platform Pack in \(.applicationName)"],
                    shortTitle: "Platform Pack",
                    systemImageName: "rectangle.3.group")
    }
}
