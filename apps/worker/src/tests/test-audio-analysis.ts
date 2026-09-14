import { analyzeAudioLoudness } from "../library/audio-analysis.js";
import { scanDirectory } from "../library/scanner.js";

const filePath = "/home/saad/Music"
let audioFiles: string[] = [];

try {
    let audioFiles = await scanDirectory(filePath)
    for(const path of audioFiles) {
        console.log(`[TEST_AUDIO_ANALYSIS]: Analyzing Audio for ${path.split('/').pop()}`);
        const result = await analyzeAudioLoudness(path);
        console.log(`[TEST_AUDIO_ANALYSIS]: analysis result:`, result);
    }

} catch (error) {
    console.error("Audio analysis failed:", error)
}
