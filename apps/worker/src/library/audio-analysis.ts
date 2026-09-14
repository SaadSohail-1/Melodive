import { spawn } from "node:child_process";

export interface AudioAnalysisResult {
    loudnessLufs: number;
    gainDb: number;
}

export async function analyzeAudioLoudness(
    filePath: string
) : Promise<AudioAnalysisResult> {
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn("ffmpeg", [ //returns a child process
            "-nostats", //turns off ffmpeg's default progress bar so output is cleaner 
            "-i", filePath, //the input file at filepath
            "-filter_complex", "ebur128=peak=true", //run the analysis filter
            "-f", "null", //format: NULL(destroys the audio), tells it to not create an output fille
            "-" //output dest: stdout
        ])

        let output = "";

        //event listeners to the stream that the spawn(ffmpeg,[...]) is producing
        //ffmpeg writes its filter stats to standard error not stdout.
        ffmpeg.stderr.on("data", (data) => {
            output += data.toString();
        })

        ffmpeg.on("close", (code) => {
            if(code!==0) {
                return reject(new Error(`FFmpeg exited with code ${code}`));
            }
            
            //added the 'g'(global) flag to find every instance in the output
            const lufsMatches = [...output.matchAll(/I:\s+([\d.-]+)\s+LUFS/g)];
            const peakMatches = [...output.matchAll(/Peak:\s+([\d.-]+)\s+dBFS/g)];

            //getting he last match from the arrays because thats the summary block
            const lastLufs = lufsMatches[lufsMatches.length - 1];
            const lastPeak = peakMatches[peakMatches.length - 1];

            //Safely check that the match exists AND that the capture group ([1]) caught the number
            if (!lastLufs || !lastLufs[1] || !lastPeak || !lastPeak[1]) {
                return reject(new Error("Failed to parse LUFS or peak from FFmpeg output"));
            }

            const loudnesslufs = parseFloat(lastLufs[1]);
            const truePeakDb = parseFloat(lastPeak[1]);
            
            //target loudness for melodive normalization
            let gainDb = -14.0 - loudnesslufs;
            
            //Safety check: If boosting a quiet track causes digital clipping
            //True peak goes above -1 dBFS, we lower the gain to protect theaudio
            if(truePeakDb + gainDb > -1.0) {
                gainDb = -1.0 - truePeakDb;
            }
            
            resolve({
                loudnessLufs: Number(loudnesslufs.toFixed(2)),
                gainDb: Number(gainDb.toFixed(2))
            })
        })
    })
}