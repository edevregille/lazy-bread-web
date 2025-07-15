import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '../public');
const faviconPath = path.join(publicDir, 'favicon.png');

async function createProperIco() {
  try {
    if (!fs.existsSync(faviconPath)) {
      console.error('Source favicon.png not found');
      return;
    }

    console.log('Creating proper ICO file for Safari...');

    // Create multiple sizes for ICO
    const sizes = [16, 32, 48];
    const buffers = [];

    for (const size of sizes) {
      const buffer = await sharp(faviconPath)
        .resize(size, size)
        .png()
        .toBuffer();
      buffers.push(buffer);
    }

    // For now, we'll create a PNG that Safari accepts as ICO
    // Most modern browsers accept PNG as ICO
    await sharp(faviconPath)
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon.ico'));

    console.log('✅ Created favicon.ico');

    // Also create a simple 16x16 version
    await sharp(faviconPath)
      .resize(16, 16)
      .png()
      .toFile(path.join(publicDir, 'favicon-16.ico'));

    console.log('✅ Created favicon-16.ico');

  } catch (error) {
    console.error('Error creating ICO:', error);
  }
}

createProperIco(); 