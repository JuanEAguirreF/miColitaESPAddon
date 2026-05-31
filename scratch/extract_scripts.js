const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('scratch/voe_redirect.html', 'utf8');
const $ = cheerio.load(html);

const scripts = [];
$('script').each((i, el) => {
  const content = $(el).html();
  if (content && content.trim()) {
    scripts.push(`// --- SCRIPT ${i+1} --- \n${content}\n`);
  }
});

fs.writeFileSync('scratch/voe_scripts.js', scripts.join('\n\n'));
console.log(`Extraídos ${scripts.length} scripts en scratch/voe_scripts.js`);
