const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check if sharp package is installed
try {
  require.resolve('sharp');
  console.log('Sharp is already installed.');
} catch (e) {
  console.log('Installing sharp package...');
  execSync('npm install sharp');
  console.log('Sharp package installed successfully.');
}

// Now import sharp
const sharp = require('sharp');

// Define input and output paths
const inputPath = path.join(__dirname, 'assets', 'hat.png');
const outputPath = path.join(__dirname, 'favicon.ico');

// Function to create favicon
async function createFavicon() {
  try {
    // Create a 32x32 favicon
    await sharp(inputPath)
      .resize(32, 32)
      .toFile('favicon-32.png');
    
    // Convert to ICO format (using sharp's Buffer output)
    const pngBuffer = await sharp('favicon-32.png')
      .toBuffer();
    
    await sharp(pngBuffer)
      .toFile(outputPath);
    
    // Cleanup temporary file
    fs.unlinkSync('favicon-32.png');
    
    console.log('Favicon created successfully at:', outputPath);
    
    // Create additional sizes for modern browsers
    const sizes = [16, 32, 48];
    
    for (const size of sizes) {
      await sharp(inputPath)
        .resize(size, size)
        .toFile(`favicon-${size}x${size}.png`);
      console.log(`Created favicon-${size}x${size}.png`);
    }
    
    console.log('All favicon files created successfully!');
  } catch (error) {
    console.error('Error creating favicon:', error);
  }
}

// Run the function
createFavicon();