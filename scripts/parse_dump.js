const fs = require('fs');

if (fs.existsSync('uidump.xml')) {
  const xml = fs.readFileSync('uidump.xml', 'utf8');
  // Match node attributes
  const nodeRegex = /<node\s+([^>]+)>/g;
  let match;
  while ((match = nodeRegex.exec(xml)) !== null) {
    const attrs = match[1];
    const textMatch = attrs.match(/text="([^"]*)"/);
    const descMatch = attrs.match(/content-desc="([^"]*)"/);
    const boundsMatch = attrs.match(/bounds="([^"]*)"/);
    const classMatch = attrs.match(/class="([^"]*)"/);
    const clickableMatch = attrs.match(/clickable="([^"]*)"/);
    
    const text = textMatch ? textMatch[1] : '';
    const desc = descMatch ? descMatch[1] : '';
    const bounds = boundsMatch ? boundsMatch[1] : '';
    const clickable = clickableMatch ? clickableMatch[1] : '';

    if (text || desc) {
      console.log(`text: "${text}" | desc: "${desc}" | clickable: ${clickable} | bounds: ${bounds}`);
    }
  }
}
