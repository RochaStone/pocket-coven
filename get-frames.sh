#!/usr/bin/env bash
# Downloads the seven painted reel frames into ./frames (run from this folder).
set -euo pipefail
BASE="https://ogvydqsynyksgbymptzm.supabase.co/storage/v1/object/public/art/reel"
mkdir -p frames
for f in 01-shell hero-v2 03-brand-v2 04-ai-architecture-v2 05-energetics-v2 06-belonging-v2 08-genius-v2; do
  curl -fsSL "$BASE/$f.jpg" -o "frames/$f.jpg" && echo "got frames/$f.jpg"
done
