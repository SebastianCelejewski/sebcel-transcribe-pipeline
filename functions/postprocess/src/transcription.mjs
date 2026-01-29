import { s3 } from "./lib/s3.mjs";

export async function loadTranscription(bucket, key) {
  console.log("Loading transcription JSON file");
  const jsonString = await s3.getJson(bucket, key);
  const transcription = JSON.parse(jsonString);
  return transcription;
}
