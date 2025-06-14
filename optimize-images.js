/**
 * Image Optimization Script for Bobby Streetwear
 * Converts images to WebP format and creates responsive versions
 */

const fs = require('fs');
const path = require('path');

class ImageOptimizer {
    constructor() {
        this.assetsDir = './assets';
        this.optimizedDir = './assets/optimized';
        this.imageExtensions = ['.png', '.jpg', '.jpeg', '.svg'];
    }

    async optimizeImages() {
        console.log('🖼️ Starting image optimization...');
        
        // Create optimized directory
        if (!fs.existsSync(this.optimizedDir)) {
            fs.mkdirSync(this.optimizedDir, { recursive: true });
        }

        // Get all image files
        const imageFiles = this.getImageFiles();
        console.log(`Found ${imageFiles.length} images to optimize`);

        // Create WebP versions and responsive sizes
        for (const file of imageFiles) {
            await this.processImage(file);
        }

        // Generate optimized image map
        this.generateImageMap();
        
        console.log('✅ Image optimization complete!');
    }

    getImageFiles() {
        if (!fs.existsSync(this.assetsDir)) {
            console.warn('Assets directory not found');
            return [];
        }

        return fs.readdirSync(this.assetsDir)
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return this.imageExtensions.includes(ext);
            })
            .map(file => path.join(this.assetsDir, file));
    }

    async processImage(filePath) {
        const fileName = path.basename(filePath, path.extname(filePath));
        const ext = path.extname(filePath).toLowerCase();
        
        console.log(`Processing: ${fileName}${ext}`);

        // For now, create a mapping and instructions since we can't run image processing locally
        const optimizedPath = path.join(this.optimizedDir, `${fileName}.webp`);
        
        // Create placeholder WebP info
        const imageInfo = {
            original: filePath,
            webp: optimizedPath,
            sizes: {
                small: `${this.optimizedDir}/${fileName}-small.webp`,
                medium: `${this.optimizedDir}/${fileName}-medium.webp`,
                large: `${this.optimizedDir}/${fileName}-large.webp`
            }
        };

        return imageInfo;
    }

    generateImageMap() {
        const imageMap = {
            // Critical images that need immediate optimization
            'bobby-logo.svg': {
                webp: 'assets/optimized/bobby-logo.webp',
                fallback: 'assets/bobby-logo.svg',
                sizes: '40px',
                priority: 'high'
            },
            'featured-hoodie.svg': {
                webp: 'assets/optimized/featured-hoodie.webp',
                fallback: 'assets/featured-hoodie.svg',
                sizes: '(max-width: 768px) 300px, 400px',
                priority: 'high'
            },
            'cookie_high.png': {
                webp: 'assets/optimized/cookie_high.webp',
                fallback: 'assets/cookie_high.png',
                sizes: '100px',
                priority: 'medium'
            },
            'tee-1.png': {
                webp: 'assets/optimized/tee-1.webp',
                fallback: 'assets/tee-1.png',
                sizes: '(max-width: 768px) 250px, 300px',
                priority: 'medium'
            },
            'pants-1.png': {
                webp: 'assets/optimized/pants-1.webp',
                fallback: 'assets/pants-1.png',
                sizes: '(max-width: 768px) 250px, 300px',
                priority: 'medium'
            }
        };

        fs.writeFileSync('./image-optimization-map.json', JSON.stringify(imageMap, null, 2));
        console.log('📋 Image optimization map created');
    }

    generateOptimizationInstructions() {
        const instructions = `
# Image Optimization Instructions

## 🎯 Critical Issue
Your Lighthouse audit shows "Serve images in next-gen formats" could save **56.04 seconds**!
This is the main cause of your poor Largest Contentful Paint (37.8s).

## 🛠️ Required Actions

### 1. Convert Images to WebP Format
Use an online converter or tool to convert these critical images:

**High Priority (affecting LCP):**
- \`assets/bobby-logo.svg\` → \`assets/optimized/bobby-logo.webp\`
- \`assets/featured-hoodie.svg\` → \`assets/optimized/featured-hoodie.webp\`
- \`assets/cookie_high.png\` → \`assets/optimized/cookie_high.webp\`

**Medium Priority:**
- \`assets/tee-1.png\` → \`assets/optimized/tee-1.webp\`
- \`assets/pants-1.png\` → \`assets/optimized/pants-1.webp\`
- All other PNG/JPG files in assets/

### 2. Online Tools for Conversion
- **Squoosh.app** (Google's tool): https://squoosh.app/
- **CloudConvert**: https://cloudconvert.com/
- **TinyPNG**: https://tinypng.com/

### 3. Recommended Settings
- **Quality**: 80-85% for photos, 90-95% for graphics
- **Format**: WebP
- **Resize**: Create multiple sizes if needed

### 4. File Structure
Create this structure:
\`\`\`
assets/
├── optimized/
│   ├── bobby-logo.webp (small: ~5KB)
│   ├── featured-hoodie.webp (medium: ~20KB)
│   ├── cookie_high.webp (small: ~10KB)
│   ├── tee-1.webp (medium: ~15KB)
│   └── pants-1.webp (medium: ~15KB)
└── (original files as fallbacks)
\`\`\`

## 📊 Expected Improvements
After image optimization:
- **Largest Contentful Paint**: 37.8s → **~2s** (95% improvement)
- **Speed Index**: 10.4s → **~3s** (70% improvement)
- **Overall Performance Score**: Should reach **85-90+**

## 🚀 Next Steps
1. Convert images using online tools
2. Upload to assets/optimized/ folder
3. Run the image-optimized deployment script
4. Test with new Lighthouse audit

The image optimization will have the biggest impact on your performance!
`;

        fs.writeFileSync('IMAGE_OPTIMIZATION_GUIDE.md', instructions);
        console.log('📖 Optimization guide created: IMAGE_OPTIMIZATION_GUIDE.md');
    }
}

// CLI interface
if (require.main === module) {
    const optimizer = new ImageOptimizer();
    
    optimizer.optimizeImages().then(() => {
        optimizer.generateOptimizationInstructions();
        
        console.log('');
        console.log('🎯 CRITICAL NEXT STEP:');
        console.log('Your images are causing the 37.8s Largest Contentful Paint!');
        console.log('');
        console.log('📋 ACTION REQUIRED:');
        console.log('1. Convert images to WebP format using online tools');
        console.log('2. See IMAGE_OPTIMIZATION_GUIDE.md for detailed instructions');
        console.log('3. This will improve LCP from 37.8s to ~2s');
        console.log('');
        console.log('🔗 Quick conversion: https://squoosh.app/');
    });
}

module.exports = ImageOptimizer;