const fs = require('fs');
const file = 'd:/The App/src/data/museumData.js';
let content = fs.readFileSync(file, 'utf8');

// 1. \n followed by lowercase letter or '('
content = content.replace(/([^\n])\n([a-z(])/g, '$1 $2');

// 2. previous line ending in comma, >, =, -, or ending with 'by', 'and', 'of', 'the', 'with' followed by \n
content = content.replace(/([,>=\-]|by|and|of|the|with)\n([A-Za-z0-9])/gi, '$1 $2');

// BCG specific: "Bacillus\nCalmette"
content = content.replace(/Bacillus\nCalmette/g, 'Bacillus Calmette');

// NPU specific: "(Reference\nprotein)"
content = content.replace(/\(Reference\nprotein\)/g, '(Reference protein)');

fs.writeFileSync(file, content, 'utf8');
console.log('Formatted museumData.js');
