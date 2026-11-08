param([string]$Serial = '10MF7BG5920005F', [switch]$UseInstalled)
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$out = Join-Path $repo 'design/screen2/simple_name_age'
$adb = 'C:/Users/LENOVO/AppData/Local/Android/Sdk/platform-tools/adb.exe'
New-Item -ItemType Directory -Force $out | Out-Null

function Phone([string[]]$Arguments) {
  & $adb -s $Serial @Arguments
  if ($LASTEXITCODE -ne 0) { throw "ADB failed: $($Arguments[0])" }
}
function Read-Ui {
  Phone @('shell', 'uiautomator', 'dump', '--compressed', '/sdcard/babyboo-simple-ui.xml') | Out-Null
  [xml]$snapshot = (Phone @('shell', 'cat', '/sdcard/babyboo-simple-ui.xml')) -join ''
  return $snapshot
}
function Tap-Node($Node) {
  if ($null -eq $Node) { throw 'Expected control missing; no unknown coordinate tap.' }
  $rect = [regex]::Matches($Node.bounds, '\d+') | ForEach-Object { [int]$_.Value }
  Phone @('shell', 'input', 'tap', ([int](($rect[0] + $rect[2]) / 2)), ([int](($rect[1] + $rect[3]) / 2)))
}
function Capture([string]$Name) {
  Start-Sleep -Seconds 2
  Phone @('shell', 'screencap', '-p', "/sdcard/babyboo-simple-$Name.png")
  Phone @('pull', "/sdcard/babyboo-simple-$Name.png", (Join-Path $out "$Name.png"))
}

$display = (Phone @('shell', 'dumpsys', 'display')) -join "`n"
if ($display -match 'Display State=OFF') {
  throw 'Phone display is off. Leave it unlocked with the top sensor uncovered before retrying.'
}

if (!$UseInstalled) {
  Phone @('install', '-r', (Join-Path $repo 'android/app/build/outputs/apk/debug/app-debug.apk'))
  Phone @('shell', 'am', 'force-stop', 'com.babyboo.app')
}
Phone @('shell', 'am', 'start', '-W', '-a', 'android.intent.action.VIEW', '-d', 'babyboo:///', '-p', 'com.babyboo.app')
Start-Sleep -Seconds $(if ($UseInstalled) { 2 } else { 30 })
$ui = Read-Ui
$entry = $ui.SelectNodes('//node') | Where-Object { $_.text -eq 'Get Started' -or $_.'content-desc' -eq 'Get Started' } | Select-Object -First 1
if ($entry) { Tap-Node $entry; Start-Sleep -Seconds 2; $ui = Read-Ui }
$field = $ui.SelectNodes('//node') | Where-Object { $_.'content-desc' -eq "Child's name" } | Select-Object -First 1
if (!$field) { throw 'Expected initial Screen 2 name field missing.' }
if ($field.text -ne 'What is the name of your child?' -and $field.text -ne '') {
  throw 'The field already has an answer; refusing to overwrite it.'
}

# Local test input only; never presses Continue or persists a child profile.
$record = Start-Process -FilePath $adb -ArgumentList @('-s', $Serial, 'shell', 'screenrecord', '--time-limit', '50', '--bit-rate', '4000000', '/sdcard/babyboo-simple-flow.mp4') -WindowStyle Hidden -PassThru
try {
  Capture '01-greeting-keyboard'
  Phone @('shell', 'input', 'text', 'Mira')
  Capture '02-name-attentive'
  $ui = Read-Ui
  Tap-Node ($ui.SelectNodes('//node') | Where-Object { $_.'content-desc' -eq 'Next' } | Select-Object -First 1)
  Capture '03-age-question'
  $ui = Read-Ui
  Tap-Node ($ui.SelectNodes('//node') | Where-Object { $_.'content-desc' -eq '2–4, Toddler / Preschool' } | Select-Object -First 1)
  Capture '04-age-selected'
  $ui = Read-Ui
  Tap-Node ($ui.SelectNodes('//node') | Where-Object { $_.'content-desc' -eq 'हिन्दी' } | Select-Object -First 1)
  Capture '05-hindi-age'
  $ui = Read-Ui
  Tap-Node ($ui.SelectNodes('//node') | Where-Object { $_.'content-desc' -eq 'English' } | Select-Object -First 1)
  $ui = Read-Ui
  Tap-Node ($ui.SelectNodes('//node') | Where-Object { $_.text -eq 'Edit name' } | Select-Object -First 1)
  Capture '06-edit-name'
} finally {
  $record.WaitForExit(55000) | Out-Null
  Phone @('pull', '/sdcard/babyboo-simple-flow.mp4', (Join-Path $out 'phone-raw.mp4'))
}
