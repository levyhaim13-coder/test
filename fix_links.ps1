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
    # Replace root-relative attributes (href/src/action) that begin with a leading slash
    # e.g. href='/210785/...'  -> href='/test/210785/...'
    $new = $new -replace "='/","='/test/"
    $new = $new -replace '="/','="/test/'
    $new = $new -replace " href='/"," href='/test/"
    $new = $new -replace ' href="/',' href="/test/'
    $new = $new -replace " src='/"," src='/test/"
    $new = $new -replace ' src="/',' src="/test/'
    $new = $new -replace " action='/"," action='/test/"
    $new = $new -replace ' action="/',' action="/test/'
    # Replace common CSS/JS root-relative usages like url(/...) and location redirects
    $new = $new -replace 'url\(/','url(/test/'
    $new = $new -replace "document\.location\.href\s*=\s*'/'","document.location.href='/test/'"
    $new = $new -replace 'document\.location\.href\s*=\s*"/"','document.location.href="/test/"'
    if ($new -ne $content) {
        Set-Content -Encoding UTF8 -Value $new -LiteralPath $p
        Write-Output "Updated: $p"
    }
}
# Stage and commit changes (commit may fail if no changes)
git add -A
try { git commit -m "Replace absolute levyhaim.co.il links with relative links" -q } catch { Write-Output "git commit failed or no changes to commit" }
