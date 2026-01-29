import { s3 } from "./lib/s3.mjs";

const SUPPORTED_LANGUAGES = ["es", "pl", "en", "pt"];

export async function createWorkPlan(bucket, baseName) {
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

export function hasWork(workPlan) {
  return workPlan.txt.length > 0 || workPlan.srt.length > 0
}

export function printWorkPlan(workPlan) {
  console.log("Work plan:");
  console.log("- TXT files to generate:", workPlan.txt);
  console.log("- SRT files to generate:", workPlan.srt);
}
