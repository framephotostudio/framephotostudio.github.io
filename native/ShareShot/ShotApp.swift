// Screenshot helper (simulator only, never shipped): shows the Platform Pack share sheet over a photo,
// exactly as it appears from Photos > Share, using the app's built-in sample portrait.
import UIKit

@main
final class ShotAppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        let w = UIWindow(frame: UIScreen.main.bounds)
        let host = UIViewController()
        host.view.backgroundColor = .black
        let photo = Bundle.main.path(forResource: "sample", ofType: "jpg").flatMap { UIImage(contentsOfFile: $0) }
        let iv = UIImageView(image: photo); iv.contentMode = .scaleAspectFit; iv.frame = host.view.bounds
        iv.autoresizingMask = [.flexibleWidth, .flexibleHeight]; host.view.addSubview(iv)
        w.rootViewController = host; w.makeKeyAndVisible(); window = w
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
            let vc = ShareViewController(); vc.injectedPhoto = photo
            vc.modalPresentationStyle = .pageSheet
            host.present(vc, animated: false)
        }
        return true
    }
}
