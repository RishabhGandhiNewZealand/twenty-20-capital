// Script to generate favicon with grey background
// This script will be used to create logo-favicon.png from logo.png

const sharp = require('sharp');
const path = require('path');

async function generateFavicon() {
  const inputPath = path.join(__dirname, '../public/logo.png');
  const outputPath = path.join(__dirname, '../public/logo-favicon.png');
  
  try {
    // Create a grey background
    const background = await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 4,
        background: { r: 128, g: 128, b: 128, alpha: 1 } // Grey background
      }
    })
    .png()
    .toBuffer();

    // Composite the logo on top of the grey background
    await sharp(background)
      .composite([
        {
          input: inputPath,
          gravity: 'center'
        }
      ])
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 128, g: 128, b: 128, alpha: 1 }
      })
      .png()
      .toFile(outputPath);

    console.log('✅ Favicon with grey background generated successfully!');
    console.log(`📁 Output: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error generating favicon:', error);
    console.log('\nMake sure you have:');
    console.log('1. Placed your logo at public/logo.png');
    console.log('2. Installed sharp: npm install sharp');
  }
}

generateFavicon();