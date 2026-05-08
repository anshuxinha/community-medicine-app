const fs = require('fs');
const content = fs.readFileSync('scratch/bunny-videos-full.json', 'utf16le');
const jsonStart = content.indexOf('{"totalItems"');
if (jsonStart === -1) {
  console.error("Could not find start of JSON");
  process.exit(1);
}
const jsonPart = content.substring(jsonStart);
try {
  const data = JSON.parse(jsonPart);
  console.log("Total Items:", data.totalItems);
  data.items.forEach(item => {
    console.log(`- ${item.title} (Status: ${item.status}, GUID: ${item.guid})`);
  });
} catch (e) {
  console.error("Failed to parse JSON:", e.message);
}
