//USAGE: npm run test:audio-analysis -- <music-directory> (from worker dir)

import { analyzeAudioLoudness } from "../library/audio-analysis.js";
import { scanDirectory } from "../library/scanner.js";

const filePath = process.argv[2];
if(!filePath) {
    console.error("Usage: npm run test:audio-analysis -- <music-directory>");
    process.exit(1);
}

let audioFiles: string[] = [];

try {
    console.time("Audio Analysis Total Time");
    let audioFiles = await scanDirectory(filePath)
    for(const path of audioFiles) {
        console.log(`[TEST_AUDIO_ANALYSIS]: Analyzing Audio for ${path.split('/').pop()}`);
        const result = await analyzeAudioLoudness(path);
        console.log(`[TEST_AUDIO_ANALYSIS]: analysis result:`, result);
    }
    console.timeEnd("Audio Analysis Total Time");

} catch (error) {
    console.error("Audio analysis failed:", error)
}
