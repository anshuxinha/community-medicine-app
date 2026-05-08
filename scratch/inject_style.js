const fs = require('fs');
const path = 'd:/The App/src/components/ReadingView.js';
let text = fs.readFileSync(path, 'utf8');

if (!text.includes('allCapsTitle: {')) {
  text = text.replace('bulletGroup: {', 'allCapsTitle: {\n    color: "#9333ea",\n    fontSize: 16,\n    fontWeight: "bold",\n    lineHeight: 24,\n    marginVertical: 4,\n  },\n  bulletGroup: {');
  fs.writeFileSync(path, text, 'utf8');
  console.log('Successfully injected allCapsTitle style definition.');
} else {
  console.log('allCapsTitle is already defined.');
}
