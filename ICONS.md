# Icon Generation Instructions

The project uses `favicon.svg` as the base icon. To generate all required PNG icons, you have several options:

## Option 1: Use an Online Tool
Visit https://realfavicongenerator.net/
- Upload `favicon.svg`
- It will generate all required sizes automatically

## Option 2: Use ImageMagick (if installed)
```bash
# Install ImageMagick (if not installed)
# Ubuntu/Debian: sudo apt install imagemagick
# macOS: brew install imagemagick

# Generate icons
convert favicon.svg -resize 16x16 favicon-16x16.png
convert favicon.svg -resize 32x32 favicon-32x32.png
convert favicon.svg -resize 180x180 apple-touch-icon.png
convert favicon.svg -resize 192x192 android-chrome-192x192.png
convert favicon.svg -resize 512x512 android-chrome-512x512.png
```

## Option 3: Manual Creation
Create PNG files at these sizes:
- `favicon-16x16.png` - 16x16px (browser tab)
- `favicon-32x32.png` - 32x32px (browser tab)
- `apple-touch-icon.png` - 180x180px (iOS home screen)
- `android-chrome-192x192.png` - 192x192px (Android home screen)
- `android-chrome-512x512.png` - 512x512px (Android splash screen)

## Current Setup
- ✅ `favicon.svg` - SVG icon (works in modern browsers)
- ✅ `site.webmanifest` - Web app manifest
- ✅ HTML updated with icon references
- ⏳ PNG files need to be generated

## Design
The current icon features:
- Blue background (#0969da)
- White "M" for Markdown
- Wavy line representing markdown syntax
