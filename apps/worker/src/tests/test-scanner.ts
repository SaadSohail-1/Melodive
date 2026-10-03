import { scanDirectory } from "../library/scanner.js";
import {resolve} from "node:path"

const musicPath = process.argv[2];
if(!musicPath) {
    console.error("Usage: npm run test:scanner -- <music_directory>");
    process.exit(1);
}
const files = await scanDirectory(musicPath);

console.log(`Found ${files.length} audio files`);

for (const file of files) {
    console.log(file);
}