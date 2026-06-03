const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'strp2p_bundle.js');
const outputFile = path.join(__dirname, 'strp2p_bundle_pretty.js');

async function run() {
  console.log("Reading JS bundle...");
  try {
    let content = fs.readFileSync(inputFile, 'utf8');
    
    // Simple regex formatting: add newlines after semicolons and braces
    content = content
      .replace(/;/g, ';\n')
      .replace(/\{/g, '{\n')
      .replace(/\}/g, '\n}\n');
      
    fs.writeFileSync(outputFile, content);
    console.log(`Saved pretty bundle to: ${outputFile} (Size: ${content.length} bytes)`);
  } catch (err) {
    console.error("Error pretty printing:", err.message);
  }
}

run();
