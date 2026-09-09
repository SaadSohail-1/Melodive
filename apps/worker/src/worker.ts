export async function startWorker() {
    console.log("Melodive worker started");

    while(true) {
        console.log("Worker polling...");

        await new Promise((resolve) => {
            setTimeout(resolve, 5000);
        });
    }
}