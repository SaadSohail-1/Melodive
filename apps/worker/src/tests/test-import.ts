import { calculateFileHash } from "../library/checksum.js";
import { importTrack } from "../library/importer.js";
import { extractMetadata } from "../library/metadata.js";

const filePath = process.argv[2];
const librarySourceId = process.argv[3];

if (!filePath || !librarySourceId) {
    throw new Error(
        "Usage: test-import <file-path> <library-source-id>",
    );
}

console.log("1. Extractin metadata");
const metadata = await extractMetadata(filePath);
console.log("2. Metadata extracted");
console.log(metadata);
const fileHash = await calculateFileHash(filePath);

console.log("3. Importing track...");
const result = await importTrack({
    filePath,
    librarySourceId,
    metadata,
    checksum: fileHash
});

console.log("4. Imported: ");
console.log(result);