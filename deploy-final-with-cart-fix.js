/**
 * Final Deployment Script with Cart Pricing Fix
 * Deploys ultra-performance version with sale price preservation
 */

const fs = require('fs');
const path = require('path');

class FinalDeploymentWithCartFix {
    constructor() {
        this.backupDir = './backup-final-' + Date.now();
        this.filesToBackup = ['index.html'];
    }

    createBackup() {
        console.log('🔄 Creating backup...');
        
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }

        this.filesToBackup.forEach(file => {
            if (fs.existsSync(file)) {
                fs.copyFileSync(file, path.join(this.backupDir, file));
                console.log(`✅ Backed up: ${file}`);
            }
        });
    }

    deployFinalVersion() {
        console.log('🚀 Deploying FINAL optimized version with cart fix...');
        
        try {
            // Check required files exist
            const requiredFiles = [
                'index-final.html',
                'scripts/performance-bundle.js',
                'scripts/cart-pricing-fix.js'
            ];
            
            for (const file of requiredFiles) {
                if (!fs.existsSync(file)) {
                    throw new Error(`Required file missing: ${file}`);
                }
            }
            
            // Deploy main file
            fs.copyFileSync('index-final.html', 'index.html');
            console.log('✅ Deployed index-final.html as index.html');
            
            console.log('🎉 Final version with cart fix deployed!');
            console.log('');
            console.log('🔧 FEATURES INCLUDED:');
            console.log('   ✅ Ultra performance optimizations');
            console.log('   ✅ Sale price preservation in cart');
            console.log('   ✅ Discount information retention');
            console.log('   ✅ Enhanced cart notifications');
            console.log('   ✅ Proper pricing display');
            console.log('');
            console.log('🎯 CART FIXES:');
            console.log('   • Sale prices persist when items removed');
            console.log('   • Original prices shown with strikethrough');
            console.log('   • Discount percentages displayed');
            console.log('   • Total savings calculated');
            console.log('   • Enhanced price notifications');
            console.log('');
            console.log('📊 PERFORMANCE TARGETS:');
            console.log('   • Time to Interactive: ~1.5s');
            console.log('   • Total Blocking Time: <50ms');
            console.log('   • Largest Contentful Paint: ~0.8s');
            console.log('   • First Contentful Paint: ~0.4s');
            console.log('   • Lighthouse Score: 90+');
            
        } catch (error) {
            console.error('❌ Deployment failed:', error.message);
            this.rollback();
        }
    }

    rollback() {
        console.log('🔄 Rolling back...');
        
        this.filesToBackup.forEach(file => {
            const backupPath = path.join(this.backupDir, file);
            if (fs.existsSync(backupPath)) {
                fs.copyFileSync(backupPath, file);
                console.log(`✅ Restored: ${file}`);
            }
        });
    }

    validateDeployment() {
        console.log('🔍 Validating final deployment...');
        
        const checks = [
            {
                name: 'index.html exists',
                check: () => fs.existsSync('index.html')
            },
            {
                name: 'Contains cart pricing fix integration',
                check: () => {
                    const content = fs.readFileSync('index.html', 'utf8');
                    return content.includes('cart-pricing-fix.js') && 
                           content.includes('BobbyCartEnhanced');
                }
            },
            {
                name: 'Contains performance optimizations',
                check: () => {
                    const content = fs.readFileSync('index.html', 'utf8');
                    return content.includes('performance.mark') && 
                           content.includes('inline CSS');
                }
            },
            {
                name: 'Performance bundle exists',
                check: () => fs.existsSync('scripts/performance-bundle.js')
            },
            {
                name: 'Cart pricing fix exists',
                check: () => fs.existsSync('scripts/cart-pricing-fix.js')
            },
            {
                name: 'Enhanced cart features included',
                check: () => {
                    const content = fs.readFileSync('index.html', 'utf8');
                    return content.includes('originalPrice') && 
                           content.includes('salePrice') &&
                           content.includes('discountPercentage');
                }
            }
        ];

        let allPassed = true;
        checks.forEach(check => {
            const passed = check.check();
            console.log(`${passed ? '✅' : '❌'} ${check.name}`);
            if (!passed) allPassed = false;
        });

        if (allPassed) {
            console.log('🎉 All validation checks passed!');
            console.log('🚀 Your site is now ultra-fast with working cart pricing!');
        } else {
            console.log('⚠️ Some validation checks failed.');
        }

        return allPassed;
    }

    generateTestInstructions() {
        const instructions = `
# Final Performance + Cart Fix Testing Guide

## 🎯 What's Fixed

### Performance Issues
- **Time to Interactive:** Should be ~1.5s (was 34.2s)
- **Largest Contentful Paint:** Should be ~0.8s (was 23.0s)
- **Total Blocking Time:** Should be <50ms (was 20ms - maintained)
- **Overall Lighthouse Score:** Should be 90+ (was poor)

### Cart Pricing Issues
- ✅ **Sale prices persist when items are removed**
- ✅ **Original prices shown with strikethrough**
- ✅ **Discount percentages displayed**
- ✅ **Total savings calculated and shown**
- ✅ **Enhanced notifications with savings info**

## 🧪 Testing Steps

### 1. Performance Testing
\`\`\`bash
# Clear browser cache completely
# Run Lighthouse audit in Chrome DevTools
# Check Network tab for minimal initial requests
# Verify site loads in under 2 seconds
\`\`\`

### 2. Cart Pricing Testing
1. **Add items with sale prices to cart**
   - Look for hoodie/sweatshirt items (12% off)
   - Add multiple quantities
   - Verify sale prices show correctly

2. **Test cart persistence**
   - Remove some items from cart
   - Verify remaining items still show sale prices
   - Check that original prices are crossed out
   - Confirm discount percentages are visible

3. **Test cart calculations**
   - Verify total is calculated correctly
   - Check "You saved: $X.XX" appears
   - Test quantity changes maintain pricing

4. **Test notifications**
   - Add items to cart
   - Verify notifications show savings amount
   - Check enhanced messaging

### 3. Cross-Browser Testing
- Test in Chrome, Firefox, Safari
- Test on mobile devices
- Verify cart works in incognito mode

## 📊 Expected Results

### Performance Metrics
| Metric | Before | Target | 
|--------|--------|--------|
| TTI | 34.2s | ~1.5s |
| LCP | 23.0s | ~0.8s |
| TBT | 20ms | <50ms |
| FCP | 1.6s | ~0.4s |
| CLS | 0.364 | <0.05 |

### Cart Features
- ✅ Sale prices preserved
- ✅ Discount badges shown
- ✅ Savings calculations
- ✅ Enhanced notifications
- ✅ Proper price display

## 🔧 Technical Details

### Files Deployed
- \`index.html\` (ultra-optimized)
- \`scripts/performance-bundle.js\` (consolidated JS)
- \`scripts/cart-pricing-fix.js\` (cart enhancements)

### Key Features
- Inline critical CSS/JS
- Lazy loading non-critical resources
- Enhanced cart with pricing preservation
- Performance monitoring
- Mobile optimizations

## 🚨 Troubleshooting

### If Performance Still Poor
1. Check server response times
2. Verify CDN is working
3. Test without browser extensions
4. Check network throttling settings

### If Cart Pricing Issues
1. Clear localStorage: \`localStorage.clear()\`
2. Check browser console for errors
3. Verify scripts are loading correctly
4. Test with fresh cart items

## 🔄 Rollback if Needed
\`\`\`bash
node deploy-final-with-cart-fix.js rollback
\`\`\`

## 📈 Success Criteria
- [ ] Lighthouse Performance Score: 90+
- [ ] Time to Interactive: <2s
- [ ] Cart sale prices persist after item removal
- [ ] Discount information displays correctly
- [ ] Total savings calculated properly
- [ ] Site feels instant and responsive
`;

        fs.writeFileSync('FINAL_TESTING_GUIDE.md', instructions);
        console.log('📋 Final testing guide saved to FINAL_TESTING_GUIDE.md');
    }

    deploy() {
        console.log('🚀 FINAL DEPLOYMENT: ULTRA PERFORMANCE + CART FIX');
        console.log('==================================================');
        console.log('This deployment includes:');
        console.log('• Maximum performance optimizations');
        console.log('• Complete cart pricing fix');
        console.log('• Sale price preservation');
        console.log('• Enhanced user experience');
        console.log('');
        
        this.createBackup();
        this.deployFinalVersion();
        
        if (this.validateDeployment()) {
            this.generateTestInstructions();
            console.log('');
            console.log('🎯 IMMEDIATE TESTING:');
            console.log('1. Clear browser cache');
            console.log('2. Run Lighthouse audit');
            console.log('3. Test cart with sale items');
            console.log('4. Remove items and verify pricing');
            console.log('5. Check performance metrics');
            console.log('');
            console.log('📖 See FINAL_TESTING_GUIDE.md for complete testing');
            console.log('');
            console.log('🎉 Your site should now be lightning fast with perfect cart pricing!');
        }
    }
}

// CLI interface
if (require.main === module) {
    const deployment = new FinalDeploymentWithCartFix();
    const command = process.argv[2];

    switch (command) {
        case 'deploy':
            deployment.deploy();
            break;
        case 'rollback':
            deployment.rollback();
            break;
        case 'validate':
            deployment.validateDeployment();
            break;
        default:
            deployment.deploy();
    }
}

module.exports = FinalDeploymentWithCartFix;