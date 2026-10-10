// npx tsx apps/server/tests/scan-progress.test.ts <BASE_URL> <MUSIC_DIRECTORY>
const BASE_URL = process.argv[2]
const API_URL = `${BASE_URL}/api/library/scan`;
const MUSIC_PATH =  process.argv[3];
const POLL_INTERVAL = 500;

type ScanJob = {
    id: number;
    type: string;
    status: string;
    progress: {
        stage: string;
        filesFound: number | null;
        filesProcessed: number;
        filesImported: number;
        filesFailed: number;
        followUpJobsQueued: number;
    } | null;
    result: unknown;
    errorMessage: string | null;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)) 

function calculatePercentage(
    processed: number,
    total: number | null
): string {
    if (total === null || total <= 0) {
        return "0.00";
    }
    return ((processed / total) * 100).toFixed(2);
}

if (!MUSIC_PATH) {
    console.error(
        "Usage: npx tsx apps/server/tests/scan-progress.test.ts <BASE_URL> <MUSIC_DIRECTORY>(from root)"
    );
    console.error(
        "npm run test:scan-progress <BASE_URL> <MUSIC_DIRECTORY> (from /Melodive/apps/server)"
    process.exit(1);
}

async function main() {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            path : MUSIC_PATH
        })
    }) 
    if(!response.ok) {
        throw new Error(`[SCAN_PROGRESS_TEST]: Failed to start scan: ${response.status}, ${await response.text()}`);
    }   
    const {job_id } = await response.json();

    console.log(`[SCAN_PROGRESS_TEST]: Watching scan progress for ${job_id}`);

    while(true) {
        const response = await fetch(`${API_URL}/${job_id}`);
        if(!response.ok) throw new Error(`[SCAN_PROGRESS_TEST]: Progress request failed ${response.status}, ${await response.text()}`);
        const job = await response.json();
        const progress = job.progress;

        console.log(
            `[${new Date().toLocaleTimeString()}]`,
            `Status: ${job.status}`,
            `Stage: ${progress?.stage ?? "UNKNOWN"}`,
            `Files: ${progress?.filesProcessed ?? 0}/${progress?.filesFound ?? "?"}`,
            `Completed: ${calculatePercentage(
                progress?.filesProcessed ?? 0, 
                progress?.filesFound ?? null
            )}%`,
            `Imported: ${progress?.filesImported ?? 0}`,
            `Failed: ${progress?.filesFailed ?? 0}`,
            `Follow-up jobs: ${progress?.followUpJobsQueued ?? 0}`
        );

        if(
            job.status==="COMPLETED" ||
            job.status === "FAILED" ||
            progress?.stage === "COMPLETED"
        ) {
            console.log("[SCAN_PROGRESS_TEST]: Final job response");
            console.log(JSON.stringify(job, null, 2));
            break;
        }
        await sleep(POLL_INTERVAL);
    }
}

main().catch((error: unknown) => {
    console.error("[SCAN_LIBRARY_TEST]: Scan progress test failed: ", error);
    process.exitCode = 1;
})