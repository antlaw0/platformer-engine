param(
    [Parameter(Mandatory=$true)]
    [string]$RepositoryPath
)
$ErrorActionPreference = 'Stop'
$source = Join-Path $PSScriptRoot 'platformer-engine'
if (-not (Test-Path (Join-Path $source 'index.html'))) { throw 'Source folder not found. Extract the entire ZIP first.' }
if (-not (Test-Path (Join-Path $RepositoryPath '.git'))) { throw "Target is not a Git repository: $RepositoryPath" }
foreach ($name in @('index.html', 'styles.css', 'README.md')) {
    Copy-Item -LiteralPath (Join-Path $source $name) -Destination (Join-Path $RepositoryPath $name) -Force
} # end top-level file loop
foreach ($folder in @('src', 'tests')) {
    $target = Join-Path $RepositoryPath $folder
    New-Item -ItemType Directory -Path $target -Force | Out-Null
    Copy-Item -Path (Join-Path (Join-Path $source $folder) '*') -Destination $target -Force
} # end source folder loop
Push-Location $RepositoryPath
try {
    git add README.md index.html styles.css src tests
    if ($LASTEXITCODE -ne 0) { throw 'git add failed' }
    git commit -m 'Implement first playable platformer and accessible tile editor'
    if ($LASTEXITCODE -ne 0) { throw 'git commit failed. Check whether files are already committed.' }
    git push origin main
    if ($LASTEXITCODE -ne 0) { throw 'git push failed. Verify remote and authentication.' }
    Write-Host 'Platformer prototype installed and pushed to GitHub.'
} finally {
    Pop-Location
} # end repository operation
