# Encode the five user-provided originals already preserved under design/reels/source.
$ErrorActionPreference='Stop'
$reelRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$reelOut=Join-Path $reelRoot 'assets/onboarding/screen1/reels'
New-Item -ItemType Directory -Path $reelOut -Force | Out-Null
$reelSources=@(
    @('01-husky','17215069_2160_3840_30fps.mp4'),
    @('02-waterfall','13197974_2160_3840_60fps.mp4'),
    @('03-palms','17058659_2160_3840_24fps.mp4'),
    @('04-hiker','12618444_1080_1920_60fps.mp4'),
    @('05-gaming','8888807-uhd_2160_4096_25fps.mp4')
)
foreach($reelItem in $reelSources){
    $reelSource=Join-Path $reelRoot ('design/reels/source/'+$reelItem[1])
    $reelTarget=Join-Path $reelOut ($reelItem[0]+'.mp4')
    & ffmpeg -hide_banner -loglevel error -y -ss 1 -i $reelSource -t 3 -vf 'scale=540:960:force_original_aspect_ratio=increase,crop=540:960,fps=30' -c:v libx264 -preset fast -profile:v main -pix_fmt yuv420p -b:v 900k -maxrate 1100k -bufsize 1800k -an -movflags +faststart $reelTarget
    if($LASTEXITCODE -ne 0){throw "Encoding failed: $($reelItem[0])"}
    & ffmpeg -hide_banner -loglevel error -y -i $reelTarget -frames:v 1 -q:v 3 (Join-Path $reelOut ($reelItem[0]+'.jpg'))
    if($LASTEXITCODE -ne 0){throw "Poster failed: $($reelItem[0])"}
    Get-Item -LiteralPath $reelTarget | Select-Object Name,Length
}
