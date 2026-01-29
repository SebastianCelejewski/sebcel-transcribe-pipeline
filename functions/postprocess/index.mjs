import { s3 } from "./lib/s3.mjs";
import { txtProcessing } from "./txtProcessing.mjs";
import { srtProcessing } from "./srtProcessing.mjs";

const SUPPORTED_LANGUAGES = ["es", "pl", "en", "pt"];

export const handler = async (event) => {
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

function decodeKey(record) {
  return decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
}

function extractBaseName(key) {
  return key.replace(/^output\/json\//, "").replace(/\.json$/i, "");
}

function isJsonFile(key) {
  return key.startsWith("output/json/") && key.endsWith(".json");
}

async function createWorkPlan(bucket, baseName) {
  const workPlan = {
    txt: [],
    srt: []
  };

  for (const lang of SUPPORTED_LANGUAGES) {
    const txtKey = `output/txt/${baseName}.${lang}.txt`;
    const srtKey = `output/srt/${baseName}.${lang}.srt`;

    if (!(await s3.objectExists(bucket, txtKey))) {
      workPlan.txt.push(lang);
    }
    if (!(await s3.objectExists(bucket, srtKey))) {
      workPlan.srt.push(lang);
    }
  }

  return workPlan;
}

function printWorkPlan(workPlan) {
  console.log("Work plan:");
  console.log("- TXT files to generate:", workPlan.txt);
  console.log("- SRT files to generate:", workPlan.srt);
}

function hasWork(workPlan) {
  return workPlan.txt.length > 0 || workPlan.srt.length > 0
}

async function loadTranscription(bucket, key) {
  console.log("Loading transcription JSON file");
  const jsonString = await s3.getJson(bucket, key);
  const transcription = JSON.parse(jsonString);
  return transcription;
}

