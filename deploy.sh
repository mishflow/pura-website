#!/bin/bash
# Pura — deploy to GitHub Pages
# Usage: ./deploy.sh "describe your change"

MESSAGE=${1:-"Update site"}

cp pages/retreat.html retreat/index.html

git add .gitignore pages/retreat.html retreat/index.html assets/ index.html CNAME
git commit -m "$MESSAGE"
git push

echo ""
echo "✓ Live at purapilatessrilanka.com/retreat/ in ~1 min"
