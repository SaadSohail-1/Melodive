//USAGE: npm run test:metadata -- <music_directory> (from worker dir)

import { extractMetadata } from "../library/metadata.js";
import { scanDirectory } from "../library/scanner.js";

const filePath = process.argv[2];
if(!filePath) {
    console.error("Usage:npm run test:metadata -- <music_directory>");
    process.exit(1);
}
let audioFiles: string[] = [];

try {    
    let audioFiles = await scanDirectory(filePath);
    for(const path of audioFiles) {
        console.log(`[TEST_METADATA]: Extracting metadata for ${path.split('/').pop()}`);
        const metadata = await extractMetadata(path);
        console.log(`[TEST_METADATA]: metadata result:`, metadata);
    }
} catch (error) {
    console.error("[TEST_METADATA]: metadata extraction failed:", error)
}