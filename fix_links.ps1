$root = 'C:\dad-website\test'
Set-Location -LiteralPath $root
Get-ChildItem -Recurse -Include *.html,*.htm | ForEach-Object {
    $p = $_.FullName
    try { Copy-Item -Force -LiteralPath $p -Destination ($p + '.bak') } catch {}
    $content = Get-Content -Raw -Encoding UTF8 -LiteralPath $p
    # Replace base href exactly
    $new = $content -replace "<base\s+href='http://www\.levyhaim\.co\.il'>","<base href='./'>"
    # Replace absolute domain prefixes
    $new = $new -replace 'http://www\.levyhaim\.co\.il/','./'
    $new = $new -replace 'http://www\.levyhaim\.co\.il','.'
    if ($new -ne $content) {
        Set-Content -Encoding UTF8 -Value $new -LiteralPath $p
        Write-Output "Updated: $p"
    }
}
# Stage and commit changes (commit may fail if no changes)
git add -A
try { git commit -m "Replace absolute levyhaim.co.il links with relative links" -q } catch { Write-Output "git commit failed or no changes to commit" }
