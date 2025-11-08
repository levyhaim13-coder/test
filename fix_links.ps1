$root = 'C:\dad-website\test'
Set-Location -LiteralPath $root

Get-ChildItem -Recurse -Include *.html,*.htm | ForEach-Object {
    $p = $_.FullName
    try { Copy-Item -Force -LiteralPath $p -Destination ($p + '.bak') } catch {}
    $content = Get-Content -Raw -Encoding UTF8 -LiteralPath $p

    $new = $content

    # Replace base href exactly
    $new = $new -replace "<base\s+href='http://www\.levyhaim\.co\.il'>","<base href='./'>"

    # Replace absolute domain prefixes
    $new = $new -replace 'http://www\.levyhaim\.co\.il/','./'
    $new = $new -replace 'http://www\.levyhaim\.co\.il','.'

    # Safely add /test/ to root-relative attribute values that start with a slash
    # Use two patterns to handle double-quoted and single-quoted attributes separately
    # Example: href="/210785/..." -> href="/test/210785/..." ; href="/test/..." remains unchanged
    $new = $new -replace '="/(?!test/)', '="/test/'
    $new = $new -replace "='/(?!test/)", "='/test/"

    # Replace url(/...) but avoid double-inserting /test/
    $new = $new -replace 'url\(\/(?!test\/)', 'url(/test/'

    # Normalize JS location redirects to always be '/test/' (handles '/' or '/test/')
    $new = $new -replace "document\.location\.href\s*=\s*'(?:\/test\/|\/)'","document.location.href='/test/'"
    $new = $new -replace 'document\.location\.href\s*=\s*"(?:\/test\/|\/)"','document.location.href="/test/"'

    # Collapse accidental duplicate /test/test/... occurrences to a single /test/
    $new = $new -replace '(/test/)+','/test/'

    if ($new -ne $content) {
        Set-Content -Encoding UTF8 -Value $new -LiteralPath $p
        Write-Output "Updated: $p"
    }
}

# Stage and commit changes (commit may fail if no changes)
git add -A
try { git commit -m "Replace absolute levyhaim.co.il links with relative links" -q } catch { Write-Output "git commit failed or no changes to commit" }
