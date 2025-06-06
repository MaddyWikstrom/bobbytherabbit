/**
 * HTML Reference Update Script for Bobby Streetwear
 * 
 * This script automatically updates script references in all HTML files
 * to use the new consolidated JavaScript files.
 * 
 * To run: node update-html-references.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const OLD_TO_NEW_MAPPING = {
  // Cart system consolidation
  'cart.js': 'cart-consolidated.js',
  'cart-checkout-system.js': 'cart-consolidated.js',
  'cart-manager-fix.js': 'cart-consolidated.js',
  
  // Shopify integration consolidation
  'shopify-integration.js': 'shopify-integration-consolidated.js',
  'shopify-integration-fixed.js': 'shopify-integration-consolidated.js',
  'shopify-integration-debug.js': 'shopify-integration-consolidated.js',
  'shopify-integration-admin-api.js': 'shopify-integration-consolidated.js',
  
  // Product fetching scripts to remove or replace
  'products-loading.js': 'shopify-integration-consolidated.js',
  'storefront-api-products.js': 'shopify-integration-consolidated.js',
  'fetch-storefront-api.js': 'shopify-integration-consolidated.js'
};

// Files to skip
const SKIP_DIRECTORIES = [
  'node_modules',
  '.git',
  'dist',
  'build'
];

// Find all HTML files in a directory recursively
function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !SKIP_DIRECTORIES.includes(file)) {
      findHtmlFiles(filePath, fileList);
    } else if (stat.isFile() && (file.endsWith('.html') || file.endsWith('.htm'))) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Process an HTML file to update script references
function processHtmlFile(filePath) {
  console.log(`Processing: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let scriptsToRemove = new Set();
  let scriptsToAdd = new Set();
  
  // Find script tags
  const scriptRegex = /<script.*?src=["'](.*?\/scripts\/.*?)["'].*?><\/script>/g;
  let match;
  
  while ((match = scriptRegex.exec(content)) !== null) {
    const fullScriptTag = match[0];
    const scriptSrc = match[1];
    const scriptFileName = path.basename(scriptSrc);
    
    // Check if this script should be updated
    if (OLD_TO_NEW_MAPPING[scriptFileName]) {
      const newFileName = OLD_TO_NEW_MAPPING[scriptFileName];
      scriptsToRemove.add(fullScriptTag);
      
      // Add path to the replacement script
      const newScriptPath = scriptSrc.replace(scriptFileName, newFileName);
      scriptsToAdd.add(`<script src="${newScriptPath}"></script>`);
    }
  }
  
  // Remove old script tags
  scriptsToRemove.forEach(scriptTag => {
    content = content.replace(scriptTag, '');
  });
  
  // Add new script tags before </body>
  if (scriptsToAdd.size > 0) {
    const uniqueScriptsToAdd = Array.from(new Set(scriptsToAdd));
    const scriptsTags = uniqueScriptsToAdd.join('\n  ');
    content = content.replace('</body>', `  ${scriptsTags}\n</body>`);
  }
  
  // Write the file if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated: ${filePath}`);
    return true;
  } else {
    console.log(`ℹ️ No changes needed: ${filePath}`);
    return false;
  }
}

// Main function
function main() {
  console.log('🔍 Starting HTML reference update process...');
  
  try {
    // Find all HTML files
    const htmlFiles = findHtmlFiles('.');
    console.log(`Found ${htmlFiles.length} HTML files to process`);
    
    // Process each file
    let updatedCount = 0;
    htmlFiles.forEach(file => {
      const updated = processHtmlFile(file);
      if (updated) updatedCount++;
    });
    
    console.log(`\n✅ Process complete. Updated ${updatedCount} out of ${htmlFiles.length} files.`);
    
    // Create a backup of the file mapping for reference
    const mappingJson = JSON.stringify(OLD_TO_NEW_MAPPING, null, 2);
    fs.writeFileSync('script-mapping.json', mappingJson);
    console.log('📄 Created script-mapping.json for reference');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
main();