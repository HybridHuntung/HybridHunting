// scripts/update-dispensaries.js
// Run with: node scripts/update-dispensaries.js

const fs = require('fs');
const path = require('path');

async function fetchDispensaries() {
  console.log('Fetching dispensaries from Leafly directory page...');
  
  // Use the HTML directory page instead of the blocked API
  const url = 'https://www.leafly.com/dispensaries/nevada/las-vegas';
  
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // Extract the __NEXT_DATA__ JSON from the HTML
    const jsonMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
    if (!jsonMatch) {
      throw new Error('Could not find dispensary data on the page');
    }
    
    const pageData = JSON.parse(jsonMatch[1]);
    
    // Navigate to the store list within the Next.js state
    const stores = pageData?.props?.pageProps?.storeLocatorResults?.data?.organicStores || [];
    
    console.log(`📊 Found ${stores.length} total stores from directory page.`);
    
    // Filter to ONLY real dispensaries with menu pages
    const dispensaries = stores.filter(store => 
      store.path && 
      store.path.includes('/dispensary-info/')
    );
    
    console.log(`✅ Filtered to ${dispensaries.length} real dispensaries (excluded clinics and CBD stores)`);
    
    // Read existing dispensaries file to preserve manually added websites
    let existingWebsites = new Map();
    try {
      const existingFile = fs.readFileSync(path.join(__dirname, '../lib/dispensaries.js'), 'utf8');
      const match = existingFile.match(/export const dispensariesToSync = (\[[\s\S]*?\]);/);
      if (match) {
        const existingDispensaries = eval(match[1]);
        existingDispensaries.forEach(disp => {
          if (disp.website && disp.leaflySlug) {
            existingWebsites.set(disp.leaflySlug, disp.website);
          }
        });
        console.log(`📝 Loaded ${existingWebsites.size} existing websites to preserve`);
      }
    } catch (e) {
      console.log('No existing dispensaries file found, starting fresh');
    }
    
    // Map to your format, preserving existing websites
    const mapped = dispensaries.map(store => {
      const leaflySlug = store.path.replace('/dispensary-info/', '');
      let website = existingWebsites.get(leaflySlug) || '';
      
      // If no existing website, try to guess
      if (!website) {
        const nameLower = store.name?.toLowerCase() || '';
        if (nameLower.includes('zen leaf')) website = 'https://zenleafdispensaries.com';
        if (nameLower.includes('curaleaf')) website = 'https://curaleaf.com';
        if (nameLower.includes('planet 13')) website = 'https://planet13lasvegas.com';
        if (nameLower.includes('jardin')) website = 'https://www.jardinlasvegas.com';
        if (nameLower.includes('cookies')) website = 'https://cookies.co';
      }
      
      return {
        name: store.name,
        leaflySlug: leaflySlug,
        city: store.address?.city || 'Las Vegas',
        state: store.address?.state || 'NV',
        address: `${store.address?.address1 || ''} ${store.address?.address2 || ''}`.trim(),
        lat: store.address?.lat || null,
        lng: store.address?.lon || null,
        website: website,
      };
    });
    
    // Remove duplicates by leaflySlug
    const uniqueMap = new Map();
    for (const disp of mapped) {
      if (!uniqueMap.has(disp.leaflySlug)) {
        uniqueMap.set(disp.leaflySlug, disp);
      }
    }
    const uniqueDispensaries = Array.from(uniqueMap.values());
    
    console.log(`📋 Unique dispensaries: ${uniqueDispensaries.length}`);
    
    // Generate the file
    const output = `// Auto-generated dispensaries list\n// Generated on ${new Date().toISOString()}\n// Source: Leafly Directory Page\n// Total: ${uniqueDispensaries.length} dispensaries\n\nexport const dispensariesToSync = [\n${uniqueDispensaries.map(d => `  {\n    name: '${(d.name || '').replace(/'/g, "\\'")}',\n    leaflySlug: '${d.leaflySlug}',\n    city: '${d.city}',\n    state: '${d.state}',\n    address: '${d.address.replace(/'/g, "\\'")}',\n    lat: ${d.lat},\n    lng: ${d.lng},\n    website: '${d.website}',\n  }`).join(',\n')}\n];\n`;
    
    fs.writeFileSync(path.join(__dirname, '../lib/dispensaries.js'), output);
    console.log(`\n✅ Updated lib/dispensaries.js with ${uniqueDispensaries.length} dispensaries`);
    
    const excluded = stores.length - dispensaries.length;
    if (excluded > 0) {
      console.log(`⚠️ Excluded ${excluded} clinics/CBD stores (no product menus)`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fetchDispensaries().catch(console.error);