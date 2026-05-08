const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const apiKey = process.env.BUNNY_STREAM_API_KEY || process.env.BUNNY_API_KEY;
const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;

async function listVideos() {
  const response = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
    headers: {
      AccessKey: apiKey,
    },
  });
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

listVideos().catch(console.error);
