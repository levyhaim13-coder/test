$root = 'C:\dad-website\test'
Set-Location $root
$tracked = git ls-files | Where-Object { $_ -like '*.bak' }
if ($tracked -and $tracked.Count -gt 0) {
    foreach ($f in $tracked) {
        git rm --cached -- "$f"
    }
    if (-not (Test-Path .gitignore)) { New-Item -Path .gitignore -ItemType File | Out-Null }
    # ensure single entry
    $gitignore = Get-Content -LiteralPath .gitignore -ErrorAction SilentlyContinue
    if ($gitignore -notcontains '*.bak') { Add-Content -Path .gitignore -Value '*.bak' }
    git add .gitignore
    git commit -m 'Remove backup (.bak) files from repo and ignore them' -q
    Write-Output 'Removed tracked .bak files and committed .gitignore'
} else {
    Write-Output 'No tracked .bak files found'
}
