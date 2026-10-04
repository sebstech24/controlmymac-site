#!/bin/zsh
# Turn the simulator screenshots (PNG, one folder per language) into the small
# WebP files the homepages use: assets/shots/v2/<lang>/<name>.webp
# usage: scripts/build-site-shots.sh <folder with en/ de/ ... subfolders>
set -e
src="$1"; out="$(cd "$(dirname "$0")/.." && pwd)/assets/shots/v2"
phone=(hero-zoom hero-premiere trackpad keyboard-draft keyboard-live shortcuts launcher look)
for dir in "$src"/*(/); do
  lang="${dir:t}"; mkdir -p "$out/$lang"
  for name in $phone; do
    [[ -f "$dir/iphone-$name.png" ]] || { echo "missing $lang/iphone-$name"; continue; }
    ffmpeg -v error -y -i "$dir/iphone-$name.png" -vf "scale=480:-2:flags=lanczos" -c:v libwebp -quality 82 "$out/$lang/$name.webp"
  done
  [[ -f "$dir/ipad-trackpad.png" ]] && ffmpeg -v error -y -i "$dir/ipad-trackpad.png" -vf "transpose=2,scale=1000:-2:flags=lanczos" -c:v libwebp -quality 80 "$out/$lang/ipad-trackpad.webp"
done
du -sh "$out"
