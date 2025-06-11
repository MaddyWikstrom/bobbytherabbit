/**
 * Script Loader Fix
 * 
 * This script prevents duplicate script loading problems by tracking
 * which scripts have already been loaded.
 */

// Create global script loader if it doesn't exist
window.BobbyScriptLoader = window.BobbyScriptLoader || {
  loadedScripts: {},
  
  // Check if a script has been loaded
  isLoaded: function(scriptId) {
    return !!this.loadedScripts[scriptId];
  },
  
  // Mark a script as loaded
  markLoaded: function(scriptId) {
    this.loadedScripts[scriptId] = true;
    console.log(`✅ Script '${scriptId}' marked as loaded`);
  },
  
  // Load a script only if it hasn't been loaded already
  loadOnce: function(scriptId, src, callback) {
    if (this.isLoaded(scriptId)) {
      console.log(`⚠️ Script '${scriptId}' already loaded, skipping`);
      if (typeof callback === 'function') {
        callback(false); // Script was already loaded
      }
      return;
    }
    
    // Create a new script element
    const script = document.createElement('script');
    script.src = src;
    script.id = `script-${scriptId}`;
    
    // Handle load event
    script.onload = () => {
      this.markLoaded(scriptId);
      if (typeof callback === 'function') {
        callback(true); // Script was loaded
      }
    };
    
    // Handle error
    script.onerror = (error) => {
      console.error(`❌ Error loading script '${scriptId}':`, error);
      if (typeof callback === 'function') {
        callback(false, error); // Script failed to load
      }
    };
    
    // Add the script to the document
    document.head.appendChild(script);
    console.log(`🔄 Loading script '${scriptId}' from ${src}`);
  }
};

// When this script loads, mark commonly duplicated scripts
document.addEventListener('DOMContentLoaded', function() {
  // Check if any scripts are already in the page
  const scriptElements = document.getElementsByTagName('script');
  for (let i = 0; i < scriptElements.length; i++) {
    const script = scriptElements[i];
    const src = script.src;
    
    if (src) {
      // Extract script name from path
      const scriptName = src.split('/').pop().split('.')[0];
      if (scriptName) {
        window.BobbyScriptLoader.markLoaded(scriptName);
      }
    }
  }
});