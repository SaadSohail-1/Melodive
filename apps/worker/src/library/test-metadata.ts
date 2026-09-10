import { extractMetadata } from "./metadata.js";

const file = process.argv[2];

if(!file) {
    throw new Error("Provide an audio file path");
}

const metadata = await extractMetadata(file);

console.log(metadata);