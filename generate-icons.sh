#!/bin/bash

# Script to generate PNG icons from SVG
# Run this after installing ImageMagick

set -e

echo "=== Markdown Studio Icon Generator ==="
echo ""

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick is not installed."
    echo ""
    echo "To install ImageMagick, run:"
    echo "  sudo apt update"
    echo "  sudo apt install -y imagemagick"
    echo ""
    exit 1
fi

echo "✅ ImageMagick is installed"
echo ""

# Check if favicon.svg exists
if [ ! -f "favicon.svg" ]; then
    echo "❌ favicon.svg not found in current directory"
    exit 1
fi

echo "Generating icon files..."
echo ""

# Generate all required sizes
echo "📦 Generating favicon-16x16.png..."
convert favicon.svg -resize 16x16 favicon-16x16.png

echo "📦 Generating favicon-32x32.png..."
convert favicon.svg -resize 32x32 favicon-32x32.png

echo "📦 Generating apple-touch-icon.png (180x180)..."
convert favicon.svg -resize 180x180 apple-touch-icon.png

echo "📦 Generating android-chrome-192x192.png..."
convert favicon.svg -resize 192x192 android-chrome-192x192.png

echo "📦 Generating android-chrome-512x512.png..."
convert favicon.svg -resize 512x512 android-chrome-512x512.png

echo ""
echo "✅ All icons generated successfully!"
echo ""
echo "Generated files:"
ls -lh favicon-*.png apple-touch-icon.png android-chrome-*.png 2>/dev/null || true
echo ""
echo "You can now commit and push these files:"
echo "  git add *.png"
echo "  git commit -m 'Add generated PNG icons'"
echo "  git push"
