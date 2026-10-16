#!/usr/bin/env bash
# Shrinks product images in a build-time copy (same filenames, still .png).
# Resizes to a sane max dimension and lossily quantizes, so references such as
# /assets/products/img_xxx.png keep working.
#
# Usage: optimize_images.sh <directory-with-pngs>
set -euo pipefail

DIR="${1:?usage: optimize_images.sh <directory-with-pngs>}"
[ -d "$DIR" ] || exit 0

shopt -s nullglob
before=0
after=0
count=0

for f in "$DIR"/*.png; do
    b=$(stat -c%s "$f")
    before=$((before + b))
    # Resize only if larger than the target box, strip metadata.
    mogrify -resize '800x800>' -strip "$f" 2>/dev/null || true
    # Lossy palette quantization; keep original if it can't beat it.
    pngquant --quality=65-90 --force --ext .png --skip-if-larger "$f" >/dev/null 2>&1 || true
    a=$(stat -c%s "$f")
    after=$((after + a))
    count=$((count + 1))
done

echo "Optimized ${count} images: $((before / 1024 / 1024)) MB -> $((after / 1024 / 1024)) MB"
