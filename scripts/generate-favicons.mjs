import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [16, 32, 48, 64, 128, 256];
const publicDir = path.join(__dirname, '../public');
const faviconPath = path.join(publicDir, 'favicon.png');

async function generateFavicons() {
  try {
    // Check if source favicon exists
    if (!fs.existsSync(faviconPath)) {
      console.error('Source favicon.png not found in public directory');
      return;
    }

    console.log('Generating favicon files...');

    // Generate different sized PNG favicons
    for (const size of sizes) {
      await sharp(faviconPath)
        .resize(size, size)
        .png()
        .toFile(path.join(publicDir, `favicon-${size}x${size}.png`));
      console.log(`Generated favicon-${size}x${size}.png`);
    }

    // Generate Apple touch icons
    const appleSizes = [180, 152, 144, 120, 114, 76, 72, 60];
    for (const size of appleSizes) {
      await sharp(faviconPath)
        .resize(size, size)
        .png()
        .toFile(path.join(publicDir, `apple-touch-icon-${size}x${size}.png`));
      console.log(`Generated apple-touch-icon-${size}x${size}.png`);
    }

    // Create a manifest.json for PWA support
    const manifest = {
      name: "Lazy Bread PDX",
      short_name: "Lazy Bread",
      description: "Organic Sourdough Cottage Bakery",
      icons: [
        {
          src: "/favicon-192x192.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "/favicon-512x512.png",
          sizes: "512x512",
          type: "image/png"
        }
      ],
      theme_color: "#8B4513",
      background_color: "#FDF8F0",
      display: "standalone"
    };

    fs.writeFileSync(
      path.join(publicDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    console.log('Generated manifest.json');

    console.log('✅ Favicon generation complete!');
  } catch (error) {
    console.error('Error generating favicons:', error);
  }
}

generateFavicons(); 