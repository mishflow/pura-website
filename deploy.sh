#!/bin/bash
# Pura — deploy to GitHub Pages
# Usage: ./deploy.sh "describe your change"
#
# Edit pages/*.html only. This script copies each one to the folder GitHub
# Pages serves it from, then commits and pushes. Editing the published copies
# (index.html, ahangama/index.html, ...) directly does not work: they get
# overwritten from pages/ on the next deploy.

set -euo pipefail

MESSAGE=${1:-"Update site"}

# source page  ->  published location
PAGES=(
  "pages/index.html:index.html"
  "pages/retreat.html:retreat/index.html"
  "pages/green-season.html:green-season/index.html"
  "pages/ahangama.html:ahangama/index.html"
  "pages/cancellations.html:cancellations/index.html"
)

# Guard: if a published copy was edited directly and is newer than its source,
# copying would silently throw those edits away. Stop and say so.
STALE=0
for pair in "${PAGES[@]}"; do
  SRC="${pair%%:*}"
  DEST="${pair##*:}"
  if [ -f "$DEST" ] && ! cmp -s "$SRC" "$DEST" && [ "$DEST" -nt "$SRC" ]; then
    echo "✗ $DEST is newer than $SRC and they differ."
    echo "  You edited the published copy directly. Copy your changes into $SRC first:"
    echo "    cp $DEST $SRC"
    STALE=1
  fi
done
if [ "$STALE" -eq 1 ]; then
  echo ""
  echo "Nothing deployed."
  exit 1
fi

for pair in "${PAGES[@]}"; do
  SRC="${pair%%:*}"
  DEST="${pair##*:}"
  mkdir -p "$(dirname "$DEST")"
  cp "$SRC" "$DEST"
  echo "  $SRC -> $DEST"
done

git add -A pages/ index.html retreat/ green-season/ ahangama/ cancellations/ assets/ CNAME .gitignore
git commit -m "$MESSAGE"
git push

echo ""
echo "✓ Live at purapilatessrilanka.com in ~1 min"
