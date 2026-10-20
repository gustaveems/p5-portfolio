#!/bin/sh
# Rebuild the downloadable CV PDF from cv/cv.html (needs Google Chrome + internet for the Carlito font).
cd "$(dirname "$0")/.." || exit 1
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=8000 \
  --print-to-pdf="assets/CV_Gustave_Soulas_2026.pdf" "file://$PWD/cv/cv.html" 2>/dev/null
pdfinfo assets/CV_Gustave_Soulas_2026.pdf 2>/dev/null | grep -E "^Pages"
