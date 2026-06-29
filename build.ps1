param(
    [string]$OutputZip = "chrome-extension.zip"
)

# Remove old zip if it exists
if (Test-Path $OutputZip) {
    Remove-Item $OutputZip
}

# Patterns to exclude (relative to project root)
$ExcludePatterns = @(
    '*.DS_Store*',
    '.git*',
    'node_modules\*',
    'package.json',
    'package-lock.json',
    '*.zip',
    'build.sh',
    'build.ps1'
)

function Test-Excluded {
    param([string]$RelativePath)
    foreach ($pattern in $ExcludePatterns) {
        if ($RelativePath -like $pattern) { return $true }
    }
    return $false
}

Write-Host "Compressing extension project..."

$root = (Get-Location).Path

# Collect all files recursively, filtering out excluded ones
$files = Get-ChildItem -Recurse -File | Where-Object {
    $relPath = $_.FullName.Substring($root.Length + 1)
    -not (Test-Excluded $relPath)
}

Compress-Archive -Path $files -DestinationPath $OutputZip -CompressionLevel Optimal

Write-Host "Done! Saved as $OutputZip"
