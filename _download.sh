#!/usr/bin/env bash
# Mirror every asset URL referenced by the 4 HTML pages into clone/<host>/<path>.
set -u
cd "$(dirname "$0")"

ASSET_HOSTS='cdn\.prod\.website-files\.com|cdn\.jsdelivr\.net|d3e54v103j8qbb\.cloudfront\.net|siena-film-foundation\.vercel\.app'

grep -E "^https://($ASSET_HOSTS)/" all_urls.txt | while read -r url; do
  # Strip scheme and any query string for the local path
  path="${url#https://}"
  path="${path%%\?*}"
  dir="$(dirname "$path")"
  mkdir -p "$dir"
  if [ -s "$path" ]; then
    echo "skip  $path"
  else
    echo "fetch $url -> $path"
    curl -s -A "Mozilla/5.0" --create-dirs -o "$path" "$url"
  fi
done
