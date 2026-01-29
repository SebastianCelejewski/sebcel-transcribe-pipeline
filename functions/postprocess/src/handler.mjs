import { decodeKey } from "./event.mjs"
import { isJsonFile, extractBaseName } from "./routing.mjs";
import { createWorkPlan, hasWork, printWorkPlan } from "./workPlan.mjs";
import { loadTranscription } from "./transcription.mjs";
import { txtProcessing } from "./txtProcessing.mjs";
import { srtProcessing } from "./srtProcessing.mjs";

export const handleEvent = async (event) => {
  const record = event.Records[0];
  const bucket = record.s3.bucket.name;
  const key = decodeKey(record);
  const baseName = extractBaseName(key);

  console.log("Processing file:", key, ", baseName:", baseName);

  if (!isJsonFile(key)) {
    console.log("Not a JSON file, skipping:", key);
    return;
  }

  const workPlan = await createWorkPlan(bucket, baseName);
  printWorkPlan(workPlan);
 
  if (!hasWork(workPlan)) {
    console.log("No postprocessing is required, skipping:", key);
    return
  }

  const transcription = await loadTranscription(bucket, key);
  await txtProcessing.generateTextFiles(bucket, baseName, workPlan.txt, transcription);
  await srtProcessing.generateSrtFiles(bucket, baseName, workPlan.srt, transcription);
};
