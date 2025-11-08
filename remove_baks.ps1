# remove_baks.ps1 - list and delete all .bak files under the repo root
$root = 'C:\dad-website\test'
Set-Location -LiteralPath $root
$baks = Get-ChildItem -Path $root -Recurse -Include *.bak -File -ErrorAction SilentlyContinue
if (-not $baks -or $baks.Count -eq 0) {
    Write-Output 'No .bak files found. Nothing to remove.'
    exit 0
}
Write-Output "Found $($baks.Count) .bak files. Listing them now:"
$baks | Select-Object FullName, @{Name='KB';Expression={[math]::Round($_.Length/1KB,2)}} | Format-Table -AutoSize

# Delete files
foreach ($f in $baks) {
    try {
        Remove-Item -LiteralPath $f.FullName -Force -ErrorAction Stop
        Write-Output "Deleted: $($f.FullName)"
    } catch {
        Write-Output "Failed to delete: $($f.FullName) - $($_.Exception.Message)"
    }
}
# confirm
$remaining = Get-ChildItem -Path $root -Recurse -Include *.bak -File -ErrorAction SilentlyContinue
Write-Output "Final .bak count: $([int]($remaining.Count))"
