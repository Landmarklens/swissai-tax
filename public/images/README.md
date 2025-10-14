# Social Media Images (OG Images)

## Current Status: SVG Placeholders

The files in this directory are **SVG placeholders** for social media sharing images (Open Graph images). They feature the Swiss flag and SwissAI Tax branding.

## What You Need to Do

These SVG files need to be converted to PNG format (1200x630px) for proper social media sharing:

### Files to Convert:
- `og-image.png.svg` → `og-image.png` (Default/multilingual)
- `og-image-en.png.svg` → `og-image-en.png` (English)
- `og-image-de.png.svg` → `og-image-de.png` (German)
- `og-image-fr.png.svg` → `og-image-fr.png` (French)
- `og-image-it.png.svg` → `og-image-it.png` (Italian)
- `og-blog.png.svg` → `og-blog.png` (Blog posts)

### How to Convert SVG to PNG:

**Option 1: Online Tool**
1. Go to https://cloudconvert.com/svg-to-png
2. Upload each SVG file
3. Set width to 1200px
4. Download the PNG

**Option 2: Command Line (if you have ImageMagick installed)**
```bash
convert og-image.png.svg -resize 1200x630 og-image.png
convert og-image-en.png.svg -resize 1200x630 og-image-en.png
convert og-image-de.png.svg -resize 1200x630 og-image-de.png
convert og-image-fr.png.svg -resize 1200x630 og-image-fr.png
convert og-image-it.png.svg -resize 1200x630 og-image-it.png
convert og-blog.png.svg -resize 1200x630 og-blog.png
```

**Option 3: Design Tool**
1. Open each SVG in Figma, Adobe Illustrator, or Inkscape
2. Export as PNG at 1200x630px
3. Optimize with TinyPNG.com if needed

### Design Recommendations:

For professional OG images, consider creating custom designs with:
- High-quality logo
- Professional typography
- Brand colors (#DC0018 red, white)
- Relevant imagery (calculator, Swiss landmarks, happy users)
- Clear value proposition

### Specifications:
- **Dimensions:** 1200x630px (Facebook/LinkedIn standard)
- **Format:** PNG or JPG
- **File Size:** Under 300KB (optimized)
- **Safe Zone:** Keep important text/logos within 1200x600px (centered)

### Once Converted:
1. Delete the `.svg` files
2. Keep only the `.png` files
3. Test on Facebook's Sharing Debugger: https://developers.facebook.com/tools/debug/
4. Test on Twitter Card Validator: https://cards-dev.twitter.com/validator

## Current Placeholder Design

The SVG placeholders feature:
- Swiss flag (red background with white cross)
- SwissAI Tax branding
- Language-specific taglines
- Domain name (swissai.tax)
- Blog-specific design for blog posts

Feel free to use these as inspiration for your final professional design!
