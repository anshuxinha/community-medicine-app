const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const apiKey = process.env.BUNNY_STREAM_API_KEY || process.env.BUNNY_API_KEY;

async function listLibraries() {
  console.log("Using API Key:", apiKey);
  const response = await fetch("https://video.bunnycdn.com/library", {
    headers: {
      AccessKey: apiKey,
    },
  });
  console.log("Status:", response.status);
  const text = await response.text();
  console.log("Response:", text);
}

listLibraries().catch(console.error);
