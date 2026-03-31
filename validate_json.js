const fs = require('fs');
const data = fs.readFileSync('src/data/mockData.json', 'utf8');
try {
    JSON.parse(data);
    console.log('Valid JSON');
} catch(e) {
    console.log('Error:', e.message);
    const match = e.message.match(/position (\d+)/);
    if (match) {
        const pos = parseInt(match[1]);
        // Find line number
        let lineNum = 1;
        let colNum = 0;
        for (let i = 0; i < pos && i < data.length; i++) {
            if (data[i] === '\n') {
                lineNum++;
                colNum = 0;
            } else {
                colNum++;
            }
        }
        console.log('At line:', lineNum, 'col:', colNum);
        console.log('Chars at pos:', JSON.stringify(data.substring(pos, pos+20)));
        console.log('Chars before pos:', JSON.stringify(data.substring(Math.max(0,pos-30), pos)));
    }
}
