// Face Couture "Platform Pack" share extension.
// Photos (or any app) → Share → Platform Pack: the photo is sized for every platform in the chosen set,
// each size framed on the face (Apple Vision, on the iPhone), and saved straight to Photos.
// Nothing leaves the iPhone.
import UIKit
import Vision
import Photos
import UniformTypeIdentifiers

final class ShareViewController: UIViewController {
    // (label, width, height)
    private let sets: [(String, [(String, CGFloat, CGFloat)])] = [
        ("Social", [("Post", 1080, 1350), ("Square", 1080, 1080), ("Story · Reels", 1080, 1920), ("Pin", 1000, 1500), ("Thumbnail", 1280, 720)]),
        ("Work", [("LinkedIn profile", 800, 800), ("Headshot", 1600, 2000), ("LinkedIn post", 1200, 630), ("X post", 1600, 900), ("Status", 1080, 1920)]),
        ("Dating", [("Hinge · Bumble · Raya", 1080, 1350), ("Tinder", 1080, 1920), ("The League", 1080, 1080)])
    ]
    private var setIndex = 0
    private var photo: UIImage?
    private var face: CGRect?          // normalized, origin top-left
    private var edge = UIColor(white: 0.93, alpha: 1)

    private let plum = UIColor(red: 0.17, green: 0.09, blue: 0.21, alpha: 1)
    private let gold = UIColor(red: 0.79, green: 0.63, blue: 0.29, alpha: 1)
    private let cream = UIColor(red: 1.0, green: 0.98, blue: 0.99, alpha: 1)

    private let titleLabel = UILabel()
    private let subLabel = UILabel()
    private let segment = UISegmentedControl(items: ["Social", "Work", "Dating"])
    private let strip = UIStackView()
    private let scroll = UIScrollView()
    private let saveButton = UIButton(type: .system)
    private let status = UILabel()
    private let spinner = UIActivityIndicatorView(style: .medium)

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = cream
        buildUI()
        loadPhoto()
    }

    // MARK: UI
    private func buildUI() {
        let bar = UIView(); bar.backgroundColor = plum; bar.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(bar)
        let cancel = UIButton(type: .system)
        cancel.setTitle("Cancel", for: .normal); cancel.setTitleColor(.white, for: .normal)
        cancel.titleLabel?.font = .systemFont(ofSize: 17)
        cancel.addTarget(self, action: #selector(close), for: .touchUpInside)
        cancel.translatesAutoresizingMaskIntoConstraints = false
        titleLabel.text = "Platform Pack"; titleLabel.textColor = .white; titleLabel.font = .boldSystemFont(ofSize: 17)
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        bar.addSubview(cancel); bar.addSubview(titleLabel)

        subLabel.text = "Every size, framed on your face, saved to Photos."
        subLabel.textColor = UIColor(red: 0.35, green: 0.27, blue: 0.44, alpha: 1)
        subLabel.font = .systemFont(ofSize: 15); subLabel.numberOfLines = 0; subLabel.textAlignment = .center
        subLabel.translatesAutoresizingMaskIntoConstraints = false

        segment.selectedSegmentIndex = 0
        segment.selectedSegmentTintColor = plum
        segment.setTitleTextAttributes([.foregroundColor: UIColor.white, .font: UIFont.boldSystemFont(ofSize: 15)], for: .selected)
        segment.setTitleTextAttributes([.foregroundColor: plum, .font: UIFont.systemFont(ofSize: 15)], for: .normal)
        segment.addTarget(self, action: #selector(setChanged), for: .valueChanged)
        segment.translatesAutoresizingMaskIntoConstraints = false

        scroll.showsHorizontalScrollIndicator = false; scroll.translatesAutoresizingMaskIntoConstraints = false
        strip.axis = .horizontal; strip.spacing = 12; strip.alignment = .bottom
        strip.translatesAutoresizingMaskIntoConstraints = false
        scroll.addSubview(strip)

        saveButton.setTitle("Save to Photos", for: .normal)
        saveButton.setTitleColor(plum, for: .normal)
        saveButton.titleLabel?.font = .boldSystemFont(ofSize: 18)
        saveButton.backgroundColor = gold; saveButton.layer.cornerRadius = 25
        saveButton.addTarget(self, action: #selector(save), for: .touchUpInside)
        saveButton.translatesAutoresizingMaskIntoConstraints = false
        saveButton.isEnabled = false; saveButton.alpha = 0.5

        status.textColor = UIColor(red: 0.18, green: 0.48, blue: 0.29, alpha: 1)
        status.font = .systemFont(ofSize: 15, weight: .semibold); status.textAlignment = .center; status.numberOfLines = 0
        status.translatesAutoresizingMaskIntoConstraints = false
        spinner.translatesAutoresizingMaskIntoConstraints = false; spinner.hidesWhenStopped = true

        [subLabel, segment, scroll, saveButton, status, spinner].forEach { view.addSubview($0) }
        let g = view.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            bar.topAnchor.constraint(equalTo: view.topAnchor), bar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            bar.trailingAnchor.constraint(equalTo: view.trailingAnchor), bar.bottomAnchor.constraint(equalTo: g.topAnchor, constant: 52),
            cancel.leadingAnchor.constraint(equalTo: bar.leadingAnchor, constant: 16), cancel.bottomAnchor.constraint(equalTo: bar.bottomAnchor, constant: -10),
            titleLabel.centerXAnchor.constraint(equalTo: bar.centerXAnchor), titleLabel.centerYAnchor.constraint(equalTo: cancel.centerYAnchor),
            subLabel.topAnchor.constraint(equalTo: bar.bottomAnchor, constant: 18),
            subLabel.leadingAnchor.constraint(equalTo: g.leadingAnchor, constant: 20), subLabel.trailingAnchor.constraint(equalTo: g.trailingAnchor, constant: -20),
            segment.topAnchor.constraint(equalTo: subLabel.bottomAnchor, constant: 16),
            segment.leadingAnchor.constraint(equalTo: g.leadingAnchor, constant: 20), segment.trailingAnchor.constraint(equalTo: g.trailingAnchor, constant: -20),
            segment.heightAnchor.constraint(equalToConstant: 40),
            scroll.topAnchor.constraint(equalTo: segment.bottomAnchor, constant: 20),
            scroll.leadingAnchor.constraint(equalTo: g.leadingAnchor), scroll.trailingAnchor.constraint(equalTo: g.trailingAnchor),
            scroll.heightAnchor.constraint(equalToConstant: 250),
            strip.leadingAnchor.constraint(equalTo: scroll.contentLayoutGuide.leadingAnchor, constant: 20),
            strip.trailingAnchor.constraint(equalTo: scroll.contentLayoutGuide.trailingAnchor, constant: -20),
            strip.topAnchor.constraint(equalTo: scroll.contentLayoutGuide.topAnchor),
            strip.bottomAnchor.constraint(equalTo: scroll.contentLayoutGuide.bottomAnchor),
            strip.heightAnchor.constraint(equalTo: scroll.frameLayoutGuide.heightAnchor),
            saveButton.topAnchor.constraint(equalTo: scroll.bottomAnchor, constant: 22),
            saveButton.leadingAnchor.constraint(equalTo: g.leadingAnchor, constant: 20), saveButton.trailingAnchor.constraint(equalTo: g.trailingAnchor, constant: -20),
            saveButton.heightAnchor.constraint(equalToConstant: 52),
            status.topAnchor.constraint(equalTo: saveButton.bottomAnchor, constant: 14),
            status.leadingAnchor.constraint(equalTo: g.leadingAnchor, constant: 20), status.trailingAnchor.constraint(equalTo: g.trailingAnchor, constant: -20),
            spinner.centerXAnchor.constraint(equalTo: scroll.centerXAnchor), spinner.centerYAnchor.constraint(equalTo: scroll.centerYAnchor)
        ])
        spinner.startAnimating()
    }

    @objc private func close() { extensionContext?.completeRequest(returningItems: nil, completionHandler: nil) }

    @objc private func setChanged() { setIndex = segment.selectedSegmentIndex; status.text = ""; refreshPreviews() }

    // MARK: Loading the shared photo
    private func loadPhoto() {
        let providers = (extensionContext?.inputItems as? [NSExtensionItem] ?? []).flatMap { $0.attachments ?? [] }
        guard let p = providers.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.image.identifier) }) else { fail("Share a photo to make a Platform Pack."); return }
        p.loadItem(forTypeIdentifier: UTType.image.identifier, options: nil) { [weak self] item, _ in
            var img: UIImage?
            if let u = item as? URL, let d = try? Data(contentsOf: u) { img = UIImage(data: d) }
            else if let d = item as? Data { img = UIImage(data: d) }
            else if let i = item as? UIImage { img = i }
            DispatchQueue.main.async {
                guard let self = self else { return }
                guard let img = img else { self.fail("This photo could not be opened."); return }
                self.prepare(img)
            }
        }
    }

    private func fail(_ msg: String) { spinner.stopAnimating(); status.textColor = .darkGray; status.text = msg }

    // upright, at most 2400 px on the long side (keeps the extension well inside its memory limit)
    private func prepare(_ src: UIImage) {
        DispatchQueue.global(qos: .userInitiated).async {
            let maxSide: CGFloat = 2400
            let s = min(1, maxSide / max(src.size.width, src.size.height))
            let size = CGSize(width: floor(src.size.width * s), height: floor(src.size.height * s))
            let fmt = UIGraphicsImageRendererFormat.default(); fmt.scale = 1; fmt.opaque = true
            let img = UIGraphicsImageRenderer(size: size, format: fmt).image { _ in src.draw(in: CGRect(origin: .zero, size: size)) }
            let face = Self.detectFace(img)
            let edge = Self.edgeColor(img)
            DispatchQueue.main.async {
                self.photo = img; self.face = face; self.edge = edge
                self.spinner.stopAnimating()
                self.saveButton.isEnabled = true; self.saveButton.alpha = 1
                if face == nil { self.subLabel.text = "No face found, so each size keeps the photo centered." }
                self.refreshPreviews()
            }
        }
    }

    private static func detectFace(_ img: UIImage) -> CGRect? {
        guard let cg = img.cgImage else { return nil }
        let req = VNDetectFaceRectanglesRequest()
        try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
        guard let best = (req.results ?? []).max(by: { $0.boundingBox.width * $0.boundingBox.height < $1.boundingBox.width * $1.boundingBox.height }) else { return nil }
        let b = best.boundingBox
        return CGRect(x: b.minX, y: 1 - b.maxY, width: b.width, height: b.height)
    }

    private static func edgeColor(_ img: UIImage) -> UIColor {
        guard let cg = img.cgImage else { return UIColor(white: 0.93, alpha: 1) }
        var px = [UInt8](repeating: 0, count: 4)
        let ctx = CGContext(data: &px, width: 1, height: 1, bitsPerComponent: 8, bytesPerRow: 4, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)
        // the top strip of the photo (usually background) averaged to one colour
        let h = max(1, cg.height / 12)
        if let top = cg.cropping(to: CGRect(x: 0, y: 0, width: cg.width, height: h)) { ctx?.interpolationQuality = .medium; ctx?.draw(top, in: CGRect(x: 0, y: 0, width: 1, height: 1)) }
        return UIColor(red: CGFloat(px[0]) / 255, green: CGFloat(px[1]) / 255, blue: CGFloat(px[2]) / 255, alpha: 1)
    }

    // MARK: Framing (same idea as the app: head with hair first, then the face itself, then zoom out on a clean backdrop)
    private func render(_ w: CGFloat, _ h: CGFloat, scale k: CGFloat = 1) -> UIImage? {
        guard let img = photo else { return nil }
        let iw = img.size.width, ih = img.size.height
        let cw = w, ch = h
        let cover = max(cw / iw, ch / ih)
        var z: CGFloat = 1, ox: CGFloat = (cw - iw * cover) / 2, oy: CGFloat = (ch - ih * cover) / 2
        if let f = face {
            let head = CGRect(x: f.minX - 0.25 * f.width, y: f.minY - 0.55 * f.height, width: f.width * 1.5, height: f.height * 1.85)
            let tight = CGRect(x: f.minX - 0.06 * f.width, y: f.minY - 0.3 * f.height, width: f.width * 1.12, height: f.height * 1.45)
            let ty: CGFloat = ch > cw * 1.05 ? 0.45 : 0.5
            func place(_ b: CGRect, _ zz: CGFloat) -> (CGFloat, CGFloat)? {
                let W = iw * cover * zz, H = ih * cover * zz
                var x = cw / 2 - b.midX * W, y = ty * ch - b.midY * H
                x = W >= cw ? min(0, max(cw - W, x)) : max(0, min(cw - W, x))
                y = H >= ch ? min(0, max(ch - H, y)) : max(0, min(ch - H, y))
                let r = CGRect(x: x + b.minX * W, y: y + b.minY * H, width: b.width * W, height: b.height * H)
                return r.minX >= -1 && r.minY >= -1 && r.maxX <= cw + 1 && r.maxY <= ch + 1 ? (x, y) : nil
            }
            if let p = place(head, 1) ?? place(tight, 1) { ox = p.0; oy = p.1 }
            else {
                let zz = max(0.3, min(1, 0.96 * cw / (tight.width * iw * cover), 0.96 * ch / (tight.height * ih * cover)))
                if let p = place(tight, zz) { z = zz; ox = p.0; oy = p.1 }
            }
        }
        let fmt = UIGraphicsImageRendererFormat.default(); fmt.scale = 1; fmt.opaque = true
        let out = CGSize(width: round(cw * k), height: round(ch * k))
        return UIGraphicsImageRenderer(size: out, format: fmt).image { ctx in
            ctx.cgContext.scaleBy(x: k, y: k)
            edge.setFill(); ctx.fill(CGRect(x: 0, y: 0, width: cw, height: ch))
            img.draw(in: CGRect(x: ox, y: oy, width: iw * cover * z, height: ih * cover * z))
        }
    }

    private func refreshPreviews() {
        strip.arrangedSubviews.forEach { $0.removeFromSuperview() }
        guard photo != nil else { return }
        for (name, w, h) in sets[setIndex].1 {
            let thumbH: CGFloat = 190, thumbW = thumbH * w / h
            let card = UIStackView(); card.axis = .vertical; card.spacing = 6; card.alignment = .center
            let iv = UIImageView(image: render(w, h, scale: min(1, (thumbW * 2) / w)))
            iv.contentMode = .scaleAspectFill; iv.clipsToBounds = true; iv.layer.cornerRadius = 12
            iv.translatesAutoresizingMaskIntoConstraints = false
            iv.widthAnchor.constraint(equalToConstant: thumbW).isActive = true
            iv.heightAnchor.constraint(equalToConstant: thumbH).isActive = true
            let l = UILabel(); l.text = "\(name)\n\(Int(w)) × \(Int(h))"; l.numberOfLines = 2; l.textAlignment = .center
            l.font = .systemFont(ofSize: 12, weight: .semibold); l.textColor = plum
            card.addArrangedSubview(iv); card.addArrangedSubview(l)
            strip.addArrangedSubview(card)
        }
    }

    // MARK: Saving
    @objc private func save() {
        saveButton.isEnabled = false; saveButton.alpha = 0.5; status.textColor = .darkGray; status.text = "Saving…"
        PHPhotoLibrary.requestAuthorization(for: .addOnly) { [weak self] st in
            guard let self = self else { return }
            guard st == .authorized || st == .limited else {
                DispatchQueue.main.async { self.fail("To save, allow Face Couture to add photos in Settings › Privacy › Photos."); self.saveButton.isEnabled = true; self.saveButton.alpha = 1 }
                return
            }
            DispatchQueue.main.async {
                let images = self.sets[self.setIndex].1.compactMap { self.render($0.1, $0.2) }
                PHPhotoLibrary.shared().performChanges({
                    for i in images { PHAssetChangeRequest.creationRequestForAsset(from: i) }
                }) { ok, _ in
                    DispatchQueue.main.async {
                        self.status.textColor = UIColor(red: 0.18, green: 0.48, blue: 0.29, alpha: 1)
                        self.status.text = ok ? "Saved to Photos ✓  \(images.count) sizes, each framed on your face." : "Could not save. Please try again."
                        self.saveButton.setTitle("Done", for: .normal); self.saveButton.isEnabled = true; self.saveButton.alpha = 1
                        if ok { self.saveButton.removeTarget(self, action: #selector(self.save), for: .touchUpInside); self.saveButton.addTarget(self, action: #selector(self.close), for: .touchUpInside) }
                    }
                }
            }
        }
    }
}
