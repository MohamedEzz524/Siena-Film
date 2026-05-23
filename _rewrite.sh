#!/usr/bin/env bash
# Rewrite asset URLs and internal nav links in the 4 page HTML files
# so the cloned site works offline / from any local web server root.
set -u
cd "$(dirname "$0")"

for f in index.html work.html about.html contact.html; do
  # Asset hosts: strip https:// so paths become relative to the page
  sed -i \
    -e 's|https://cdn\.prod\.website-files\.com/|cdn.prod.website-files.com/|g' \
    -e 's|https://cdn\.jsdelivr\.net/|cdn.jsdelivr.net/|g' \
    -e 's|https://siena-film-foundation\.vercel\.app/|siena-film-foundation.vercel.app/|g' \
    -e 's|https://d3e54v103j8qbb\.cloudfront\.net/js/jquery-3\.5\.1\.min\.dc5e7f18c8\.js?site=6728a72e769070a603d43c13|d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js|g' \
    "$f"

  # Internal nav: route to local html files (use word-boundary quotes to avoid touching /work/* style paths if any)
  sed -i \
    -e 's|href="/"|href="index.html"|g' \
    -e 's|href="/work"|href="work.html"|g' \
    -e 's|href="/about"|href="about.html"|g' \
    -e 's|href="/contact"|href="contact.html"|g' \
    -e 's|href="/cookies"|href="https://www.siena.film/cookies"|g' \
    -e 's|href="/privacy"|href="https://www.siena.film/privacy"|g' \
    -e 's|href="/terms"|href="https://www.siena.film/terms"|g' \
    "$f"
done

echo "Rewrite complete."
