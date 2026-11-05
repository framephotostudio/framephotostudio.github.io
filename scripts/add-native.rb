# Adds Face Couture's native iPhone pieces to the Capacitor Xcode project (run after `npx cap add ios`):
#  - PackShare: a Share extension (Photos → Share → Platform Pack) that frames and saves every size on the iPhone
#  - PackIntent.swift: the "Make a Platform Pack" App Shortcut in the main app
require 'xcodeproj'
require 'fileutils'
root = File.expand_path('..', __dir__)
ios = File.join(root, 'ios', 'App')
FileUtils.mkdir_p(File.join(ios, 'PackShare'))
FileUtils.cp(File.join(root, 'native', 'PackShare', 'ShareViewController.swift'), File.join(ios, 'PackShare'))
FileUtils.cp(File.join(root, 'native', 'PackShare', 'Info.plist'), File.join(ios, 'PackShare'))
FileUtils.cp(File.join(root, 'native', 'App', 'PackIntent.swift'), File.join(ios, 'App'))

proj = Xcodeproj::Project.open(File.join(ios, 'App.xcodeproj'))
app = proj.targets.find { |t| t.name == 'App' } or abort('App target not found')
app_cfg = app.build_configurations.first.build_settings
deploy = app_cfg['IPHONEOS_DEPLOYMENT_TARGET'] || '15.0'
bundle = app_cfg['PRODUCT_BUNDLE_IDENTIFIER'] || 'app.facecouture.studio'

# App Shortcut in the main app
app_group = proj.main_group.children.find { |g| g.respond_to?(:path) && (g.path == 'App' || g.display_name == 'App') } || proj.main_group
unless app.source_build_phase.files_references.any? { |f| f.path.to_s.end_with?('PackIntent.swift') }
  ref = app_group.new_file('PackIntent.swift')
  app.add_file_references([ref])
end

# Share extension target
unless proj.targets.any? { |t| t.name == 'PackShare' }
  ext = proj.new_target(:app_extension, 'PackShare', :ios, deploy, nil, :swift)
  grp = proj.main_group.new_group('PackShare', 'PackShare')
  src = grp.new_file('ShareViewController.swift')
  grp.new_file('Info.plist')
  ext.add_file_references([src])
  ext.build_configurations.each do |c|
    s = c.build_settings
    s['PRODUCT_BUNDLE_IDENTIFIER'] = bundle + '.PackShare'
    s['PRODUCT_NAME'] = '$(TARGET_NAME)'
    s['INFOPLIST_FILE'] = 'PackShare/Info.plist'
    s['GENERATE_INFOPLIST_FILE'] = 'NO'
    s['SWIFT_VERSION'] = '5.0'
    s['TARGETED_DEVICE_FAMILY'] = '1'
    s['IPHONEOS_DEPLOYMENT_TARGET'] = deploy
    s['CODE_SIGN_STYLE'] = 'Automatic'
    s['SKIP_INSTALL'] = 'YES'
    s['APPLICATION_EXTENSION_API_ONLY'] = 'YES'
    s['LD_RUNPATH_SEARCH_PATHS'] = ['$(inherited)', '@executable_path/Frameworks', '@executable_path/../../Frameworks']
    s['MARKETING_VERSION'] = ENV['APP_VERSION'] || app_cfg['MARKETING_VERSION'] || '1.0.0'
    s['CURRENT_PROJECT_VERSION'] = ENV['BUILD_NUMBER'] || app_cfg['CURRENT_PROJECT_VERSION'] || '1'
    s['DEVELOPMENT_TEAM'] = ENV['TEAM'] if ENV['TEAM'] && !ENV['TEAM'].empty?
  end
  app.add_dependency(ext)
  embed = app.copy_files_build_phases.find { |p| p.symbol_dst_subfolder_spec == :plug_ins } || app.new_copy_files_build_phase('Embed Foundation Extensions')
  embed.symbol_dst_subfolder_spec = :plug_ins
  bf = embed.add_file_reference(ext.product_reference, true)
  bf.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
end
# Screenshot helper app (simulator only, only when SHARE_SHOT=1; never part of the App Store build)
if ENV['SHARE_SHOT'] == '1' && !proj.targets.any? { |t| t.name == 'ShareShot' }
  FileUtils.mkdir_p(File.join(ios, 'ShareShot'))
  FileUtils.cp(File.join(root, 'native', 'ShareShot', 'ShotApp.swift'), File.join(ios, 'ShareShot'))
  FileUtils.cp(File.join(root, 'native', 'ShareShot', 'sample.jpg'), File.join(ios, 'ShareShot'))
  shot = proj.new_target(:application, 'ShareShot', :ios, deploy, nil, :swift)
  sg = proj.main_group.new_group('ShareShot', 'ShareShot')
  pg = proj.main_group.children.find { |g| g.respond_to?(:path) && g.path == 'PackShare' }
  srcs = [sg.new_file('ShotApp.swift'), pg.files.find { |f| f.path == 'ShareViewController.swift' }]
  shot.add_file_references(srcs)
  shot.add_resources([sg.new_file('sample.jpg')])
  shot.build_configurations.each do |c|
    s = c.build_settings
    s['PRODUCT_BUNDLE_IDENTIFIER'] = bundle + '.shot'
    s['PRODUCT_NAME'] = '$(TARGET_NAME)'
    s['GENERATE_INFOPLIST_FILE'] = 'YES'
    s['INFOPLIST_KEY_UILaunchScreen_Generation'] = 'YES'
    s['INFOPLIST_KEY_UIStatusBarStyle'] = 'UIStatusBarStyleLightContent'
    s['SWIFT_VERSION'] = '5.0'
    s['TARGETED_DEVICE_FAMILY'] = '1'
    s['IPHONEOS_DEPLOYMENT_TARGET'] = deploy
    s['CODE_SIGNING_ALLOWED'] = 'NO'
  end
end
proj.save
puts 'Native pieces added: PackShare extension, PackIntent shortcut'
