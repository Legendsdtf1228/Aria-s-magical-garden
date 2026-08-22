# Creates / updates Desktop shortcuts for Aria's Color Garden.
# Invoked by CREATE-DESKTOP-SHORTCUTS.bat with -ExecutionPolicy Bypass (session only).

param(
  [Parameter(Mandatory = $true)][string]$ProjectRoot
)

$ErrorActionPreference = "Stop"
$ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$play = Join-Path $ProjectRoot "LAUNCH-ARIA-GAME.bat"
$close = Join-Path $ProjectRoot "STOP-ARIA-GAME.bat"

if (-not (Test-Path -LiteralPath $play)) { throw "Missing LAUNCH-ARIA-GAME.bat" }
if (-not (Test-Path -LiteralPath $close)) { throw "Missing STOP-ARIA-GAME.bat" }

$desktop = [Environment]::GetFolderPath("Desktop")
if (-not $desktop -or -not (Test-Path -LiteralPath $desktop)) {
  throw "Could not resolve Desktop folder"
}

$shell = New-Object -ComObject WScript.Shell
$sys = $env:SystemRoot

$playShortcut = Join-Path $desktop "Play Aria's Color Garden.lnk"
$s1 = $shell.CreateShortcut($playShortcut)
$s1.TargetPath = $play
$s1.WorkingDirectory = $ProjectRoot
$s1.WindowStyle = 1
$s1.Description = "Start Aria's Color Garden"
$s1.IconLocation = "$sys\System32\shell32.dll,137"
$s1.Save()

$closeShortcut = Join-Path $desktop "Close Aria's Color Garden.lnk"
$s2 = $shell.CreateShortcut($closeShortcut)
$s2.TargetPath = $close
$s2.WorkingDirectory = $ProjectRoot
$s2.WindowStyle = 1
$s2.Description = "Stop Aria's Color Garden server on port 5173"
$s2.IconLocation = "$sys\System32\shell32.dll,131"
$s2.Save()

Write-Host "Desktop: $desktop"
Write-Host "Updated: Play Aria's Color Garden.lnk"
Write-Host "Updated: Close Aria's Color Garden.lnk"
