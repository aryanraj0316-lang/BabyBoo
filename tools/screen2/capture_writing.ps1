param([string]$Serial = '10MF7BG5920005F', [string]$OutputDirectory = 'design/screen2/approved_writing/phone', [switch]$LeaveReady, [switch]$UseInstalled)
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$out = Join-Path $repo $OutputDirectory
$adb = 'C:/Users/LENOVO/AppData/Local/Android/Sdk/platform-tools/adb.exe'
New-Item -ItemType Directory -Force $out | Out-Null
function Phone([string[]]$Arguments) {
  & $adb -s $Serial @Arguments
  if ($LASTEXITCODE -ne 0) { throw "ADB failed: $($Arguments[0])" }
}
function Read-Ui {
  Phone @('shell','uiautomator','dump','--compressed','/sdcard/babyboo-writing-ui.xml') | Out-Null
  return [xml]((Phone @('shell','cat','/sdcard/babyboo-writing-ui.xml')) -join '')
}
function Tap-Node($Node) {
  if (!$Node) { throw 'Expected control missing; refusing unknown tap.' }
  $rect = [regex]::Matches($Node.bounds,'\d+') | ForEach-Object { [int]$_.Value }
  Phone @('shell','input','tap',([int](($rect[0]+$rect[2])/2)),([int](($rect[1]+$rect[3])/2)))
}
function Capture([string]$Name) {
  Phone @('shell','screencap','-p',"/sdcard/babyboo-writing-$Name.png")
  Phone @('pull',"/sdcard/babyboo-writing-$Name.png",(Join-Path $out "$Name.png"))
}
$display = (Phone @('shell','dumpsys','display')) -join "`n"
if ($display -match 'Display State=OFF') { throw 'Phone display off; leave unlocked and uncovered.' }
if (!$UseInstalled) { Phone @('install','-r',(Join-Path $repo 'android/app/build/outputs/apk/debug/app-debug.apk')) }
Phone @('shell','am','force-stop','com.babyboo.app')
Phone @('shell','am','start','-W','-a','android.intent.action.VIEW','-d','babyboo:///','-p','com.babyboo.app')
Start-Sleep -Seconds 30
$ui = Read-Ui
Tap-Node ($ui.SelectNodes('//node') | Where-Object { $_.text -eq 'Get Started' -or $_.'content-desc' -eq 'Get Started' } | Select-Object -First 1)
Start-Sleep -Seconds 2
$ui = Read-Ui
$field = $ui.SelectNodes('//node') | Where-Object { $_.'content-desc' -eq "Child's name" } | Select-Object -First 1
if (!$field -or ($field.text -ne '' -and $field.text -ne 'What is the name of your child?')) { throw 'Expected empty name field missing.' }
$record = Start-Process -FilePath $adb -ArgumentList @('-s',$Serial,'shell','screenrecord','--time-limit','45','--bit-rate','5000000','/sdcard/babyboo-writing.mp4') -WindowStyle Hidden -PassThru
$watch = [Diagnostics.Stopwatch]::StartNew()
$events = [Collections.Generic.List[object]]::new()
try {
  Start-Sleep -Seconds 2
  Capture '01-before'
  foreach ($chunk in @('Ale','xand','rina')) {
    foreach ($letter in $chunk.ToCharArray()) {
      $events.Add(@{seconds=$watch.Elapsed.TotalSeconds;event='type';character=[string]$letter})
      Phone @('shell','input','text',([string]$letter))
      Start-Sleep -Milliseconds 350
    }
    $events.Add(@{seconds=$watch.Elapsed.TotalSeconds;event='pause'})
    Start-Sleep -Seconds 2
  }
  Capture '02-written'
  # Dismiss the keyboard without submitting. Return to the approved forward pose;
  # name field must remain available on the same page.
  $events.Add(@{seconds=$watch.Elapsed.TotalSeconds;event='dismiss-keyboard'})
  Phone @('shell','input','keyevent','4')
  Start-Sleep -Seconds 2
  Capture '04-keyboard-dismissed'
  $ui = Read-Ui
  $field = $ui.SelectNodes('//node') | Where-Object { $_.'content-desc' -eq "Child's name" } | Select-Object -First 1
  Tap-Node $field
  $events.Add(@{seconds=$watch.Elapsed.TotalSeconds;event='refocus'})
  Start-Sleep -Seconds 2
  Capture '05-refocused'
  $ui = Read-Ui
  $events.Add(@{seconds=$watch.Elapsed.TotalSeconds;event='submit-name'})
  Tap-Node ($ui.SelectNodes('//node') | Where-Object { $_.'content-desc' -eq 'Next' } | Select-Object -First 1)
  Start-Sleep -Seconds 2
  Capture '03-age'
  # Never presses Continue or persists a profile. Test name remains local.
} finally {
  $events | ConvertTo-Json | Set-Content -Encoding UTF8 (Join-Path $out 'events.json')
  $record.WaitForExit(48000) | Out-Null
  Phone @('pull','/sdcard/babyboo-writing.mp4',(Join-Path $out 'phone.mp4'))
}
if ($LeaveReady) {
  $ui = Read-Ui
  Tap-Node ($ui.SelectNodes('//node') | Where-Object { $_.text -eq 'Edit name' } | Select-Object -First 1)
  Start-Sleep -Seconds 2
  $ui = Read-Ui
  Tap-Node ($ui.SelectNodes('//node') | Where-Object { $_.'content-desc' -eq 'Clear name' } | Select-Object -First 1)
  Start-Sleep -Seconds 1
  Capture '06-ready-to-type'
}
