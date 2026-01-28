import { s3 } from "./lib/s3.mjs";
import { translate } from "./lib/translate.mjs";
import { segmentation } from "./lib/segmentation.mjs";
import { srt } from "./lib/srt.mjs";

const SUPPORTED_LANGUAGES = ["es", "pl", "en", "pt"];

export const handler = async (event) => {
  const record = event.Records[0];
  const bucket = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
  const baseName = key.replace(/^output\/json\//, "").replace(/\.json$/i, "");

  console.log("Processing file:", key, ", baseName:", baseName);

  if (!key.startsWith("output/json/") || !key.endsWith(".json")) {
    console.log("Not a JSON file, skipping:", key);
    return;
  }

  const workPlan = await createWorkPlan(bucket, baseName);
  console.log("Work plan:", JSON.stringify(workPlan));

  const requiredLanguages = new Set([...workPlan.txt, ...workPlan.srt]);

  if ([...requiredLanguages].length === 0) {
    console.log("No postprocessing is required. Terminating.")
    return
  }

  console.log("Loading transcription JSON file");
  const jsonString = await s3.getJson(bucket, key);
  const transcription = JSON.parse(jsonString);

  await generateTextFiles(bucket, baseName, [...workPlan.txt], transcription);
  await generateSrtFiles(bucket, baseName, [...workPlan.srt], transcription);
};

async function translateSegments(segments, source, target) {
  const result = [];

  for (const seg of segments) {
    const translated = await translate.translateText(seg.text, source, target);
    result.push({
      start: seg.start,
      end: seg.end,
      text: translated
    });
  }

  return result;
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

async function generateTextFiles(bucket, baseName, requiredLanguages, transcription) {
  if (requiredLanguages.length === 0) {
    console.log("TXT files generation skipped: No txt translation required.");
    return;
  }

  const originalText = transcription?.results?.transcripts?.[0]?.transcript || "";
  if (!originalText) {
    console.log("TXT files generation skipped: No transcript text found.");
    return;
  }
   
  console.log("TXT files generation started");

  const baseLang = getBaseLang(transcription);
  const textTranslations = await prepareTxtTranslations(originalText, baseLang, requiredLanguages);
  await saveTxtFiles(bucket, baseName, requiredLanguages, textTranslations);

  console.log("TXT files generation completed");
}

async function generateSrtFiles(bucket, baseName, requiredLanguages, transcription) {
  if (requiredLanguages.length === 0) {
    console.log("SRT files generation skipped: No srt translation required.");
    return;
  }

  console.log("SRT files generation started");

  const baseLang = getBaseLang(transcription);
  const baseSegments = buildBaseSegments(transcription);
  const srtTranslations = await prepareSrtTranslations(baseSegments, baseLang, requiredLanguages);
  await saveSrtFiles(bucket, baseName, requiredLanguages, srtTranslations);

  console.log("SRT files generation completed");
}

function getBaseLang(transcription) {
  const detectedLangFull = transcription.results.language_code || "es-ES";
  const baseLang = detectedLangFull.slice(0, 2);
  return baseLang;
}

async function prepareTxtTranslations(originalText, baseLang, requiredLanguages) {
  console.log("Preparing text translations for " + requiredLanguages.join(", "));
  const allTexts = {};
  
  for (const lang of requiredLanguages) {
    if (lang === baseLang) {
      console.log("Skipping translation to base language:", lang);
      allTexts[lang] = originalText
    } else {
      console.log("Translating text to:", lang);
      const translatedText = await translate.translateText(originalText, baseLang, lang);
      allTexts[lang] = translatedText;
    }
  }

  return allTexts;
}

async function saveTxtFiles(bucket, baseName, requiredLanguages, txtTranslations) {
  console.log("Saving text files")
  for (const lang of requiredLanguages) {
    const key = `output/txt/${baseName}.${lang}.txt`
    const text = txtTranslations[lang]
    s3.putSrt(bucket, key, text)
  }
}

function buildBaseSegments(transcription) {
  console.log("Building time segments from audio segments");
  const audioSegments = transcription.results.audio_segments;
  const timeSegments = segmentation.buildSegmentsFromAudio(audioSegments);

  console.log("Building base segments");
  const baseSegments = timeSegments.map(seg => ({
    start: seg.start,
    end: seg.end,
    text: seg.text
  }));

  return baseSegments;
}

async function prepareSrtTranslations(baseSegments, baseLang, requiredLanguages) {
  const allSrts = {};

  for (const lang of requiredLanguages) {
    if (lang === baseLang) {
      console.log("Skipping translation to base language:", lang);
      allSrts[lang] = srt.makeSrt(baseSegments);
    } else {
      console.log("Translating segments to", lang);
      const translatedSegments = await translateSegments(
        baseSegments,
        baseLang,
        lang
      );
      allSrts[lang] = srt.makeSrt(translatedSegments);
    }
  }

  return allSrts;
}

async function saveSrtFiles(bucket, baseName, requiredLanguages, srtTranslations) {
  console.log("Saving srt files")
  for (const lang of requiredLanguages) {
    const key = `output/srt/${baseName}.${lang}.srt`
    const text = srtTranslations[lang]
    s3.putSrt(bucket, key, text)
  }
}
