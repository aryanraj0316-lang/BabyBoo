param([string]$AdbPath, [string]$Serial, [ValidateSet('review','motion')][string]$Shot = 'review')

# Run in a normal PowerShell session; produces evidence for human frame review.
$ErrorActionPreference = 'Stop'
$reviewRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
if (-not $AdbPath) {
    $sdkRoot = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA 'Android/Sdk' }
    $AdbPath = Join-Path $sdkRoot 'platform-tools/adb.exe'
}
if (-not (Test-Path -LiteralPath $AdbPath)) { throw "adb is unavailable at $AdbPath. Supply -AdbPath with its installed path." }
$ffmpegPath = (Get-Command ffmpeg -ErrorAction Stop).Source
function Invoke-Adb {
    & $AdbPath -s $script:reviewSerial @args
    if ($LASTEXITCODE -ne 0) { throw "adb failed: $args" }
}
Push-Location $reviewRoot
try {
    $branch = & git branch --show-current
    if ($LASTEXITCODE -ne 0 -or $branch -ne 'onboarding-screen1-rebuild') { throw 'Expected branch onboarding-screen1-rebuild; no branch was changed.' }
    $deviceLines = & $AdbPath devices -l
    if ($LASTEXITCODE -ne 0) { throw 'adb device discovery failed.' }
    $connected = @($deviceLines | Where-Object { $_ -match '^\S+\s+device(?:\s|$)' } | ForEach-Object { ($_ -split '\s+')[0] })
    if ($Serial) {
        if ($Serial -notin $connected) { throw 'Requested device is not authorized and connected. Unlock it and check USB debugging.' }
        $script:reviewSerial = $Serial
    } else {
        if ($connected.Count -ne 1) { throw "Expected one authorized phone; found $($connected.Count). Check USB debugging or pass -Serial." }
        $script:reviewSerial = $connected[0]
    }
    $reviewStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $phaseFolder = if ($Shot -eq 'motion') { 'animation_review' } else { 'assembly_review' }
    $reviewOut = Join-Path $reviewRoot "design/buddy/$phaseFolder/recording/$reviewStamp"
    New-Item -ItemType Directory -Path (Join-Path $reviewOut 'frames') -Force | Out-Null
    Push-Location (Join-Path $reviewRoot 'android')
    try {
        & .\gradlew.bat :app:assembleDebug -I ../tools/buddy/review-build.init.gradle -PreactNativeArchitectures=arm64-v8a --console=plain
        if ($LASTEXITCODE -ne 0) { throw 'Review APK build failed; no recording attempted.' }
    } finally { Pop-Location }
    $reviewApk = Join-Path $reviewRoot 'android/app/build/outputs/apk/debug/app-debug.apk'
    Invoke-Adb install -r $reviewApk
    Invoke-Adb shell input keyevent KEYCODE_WAKEUP
    Invoke-Adb shell am force-stop com.babyboo.app
    Invoke-Adb shell 'am start -W -a android.intent.action.VIEW -d "babyboo://dev/buddy-lab?cutout=1" -p com.babyboo.app'
    Start-Sleep -Seconds 6
    # The standalone debug runtime can miss the cold-start link; resend warm.
    Invoke-Adb shell 'am start -W -a android.intent.action.VIEW -d babyboo://dev/buddy-lab?cutout=1 -p com.babyboo.app'
    Start-Sleep -Seconds 3
    $reviewRemote = "/sdcard/buddy-review-$reviewStamp"
    Invoke-Adb shell uiautomator dump "$reviewRemote.xml"
    Invoke-Adb pull "$reviewRemote.xml" (Join-Path $reviewOut 'launch-ui.xml')
    if ((Get-Content -Raw -LiteralPath (Join-Path $reviewOut 'launch-ui.xml')) -notmatch 'Buddy Lab / rendered cut-out assembly') {
        Invoke-Adb shell screencap -p "$reviewRemote.png"
        Invoke-Adb pull "$reviewRemote.png" (Join-Path $reviewOut 'launch-failed.png')
        throw "The cutout lab title was not detected. Review $reviewOut/launch-failed.png before recording."
    }
    # Escape ampersands for the remote shell, including Windows PowerShell 5.
    $recordCommand = 'am start -W -a android.intent.action.VIEW -d babyboo://dev/buddy-lab?cutout=1\&record=1\&shot=' + $Shot + ' -p com.babyboo.app'
    Invoke-Adb shell $recordCommand
    Start-Sleep -Seconds 4
    Invoke-Adb shell input keyevent KEYCODE_WAKEUP
    Invoke-Adb shell screencap -p "$reviewRemote.png"
    Invoke-Adb pull "$reviewRemote.png" (Join-Path $reviewOut 'recording-screen.png')
    Invoke-Adb shell screenrecord --time-limit 20 --bit-rate 8000000 "$reviewRemote.mp4"
    $reviewVideo = Join-Path $reviewOut 'buddy-assembly-phone.mp4'
    Invoke-Adb pull "$reviewRemote.mp4" $reviewVideo
    & $ffmpegPath -hide_banner -loglevel error -i $reviewVideo -vf 'fps=10' (Join-Path $reviewOut 'frames/frame-%04d.png')
    if ($LASTEXITCODE -ne 0) { throw 'Video pulled, but frame extraction failed.' }
    & $ffmpegPath -hide_banner -loglevel error -i $reviewVideo -vf 'fps=2,scale=216:-2,tile=5x4:padding=6:margin=6:color=0xF6F3FF' -fps_mode vfr (Join-Path $reviewOut 'contact-%02d.png')
    if ($LASTEXITCODE -ne 0) { throw 'Video and frames saved, but contact sheet extraction failed.' }
    @{
        recordedAt = (Get-Date).ToString('o')
        branch = $branch
        apkSha256 = (Get-FileHash -LiteralPath $reviewApk -Algorithm SHA256).Hash
        phase = if ($Shot -eq 'motion') { 'Animated Buddy Lab spike' } else { 'Static assembly and discrete face diagnostics' }
        reviewStatus = 'Captured; human frame review still required. Not visual approval.'
    } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $reviewOut 'capture.json') -Encoding UTF8
    Write-Host "Saved recording, frames and contact sheets to $reviewOut"
    Write-Host 'Return to the agent for frame review; capture alone does not verify the artwork.'
} finally { Pop-Location }
