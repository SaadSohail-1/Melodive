import { scanDirectory } from "../library/scanner.js";
import {resolve} from "node:path"

const musicPath = resolve("/home/saad/Music")
const files = await scanDirectory(musicPath);

console.log(`Found ${files.length} audio files`);

for (const file of files) {
    console.log(file);
}