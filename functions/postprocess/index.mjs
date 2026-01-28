import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";
import { s3ObjectExists, getJson, putTxt, putSrt } from "./s3.mjs";
const translateClient = new TranslateClient({ region: process.env.TRANSLATE_REGION });

export const handler = async (event) => {
  const record = event.Records[0];
  const bucket = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

  console.log("Processing file:", key)

  if (!key.startsWith("output/json/") || !key.endsWith(".json")) {
    console.log("Not a JSON file, skipping:", key);
    return;
  }

  const baseName = key
    .replace(/^output\/json\//, "")
    .replace(/\.json$/i, "");

  const txtOutputKey = `output/txt/${baseName}.txt`;

  console.log("Loading transcription JSON file");


  const transcription = getJson(bucket, key)

  if (await s3ObjectExists(bucket, txtOutputKey)) {
    console.log("Text translation already exists in", txtOutputKey, ", skipping:", key);
  }
  else {
    console.log("Fetching full text");
    const text = transcription?.results?.transcripts?.[0]?.transcript || "";

    if (!text) {
      console.log("No transcript text found, skipping");
      return;
    }

    console.log("Saving full text to a txt file")
    await putTxt(bucket, txtOutputKey, text)

    console.log("Full text written:", txtOutputKey);
  }

  console.log("Generating SRT files");

  const detectedLangFull = transcription.results.language_code || "es-ES";
  const detectedLang = detectedLangFull.slice(0, 2);

  console.log("Detected language:", detectedLang);

  console.log("Building time segments from audio segments");
  const audioSegments = transcription.results.audio_segments;
  const timeSegments = buildSegmentsFromAudio(audioSegments);

  console.log("Building base segments");
  const baseLang = detectedLang;
  const baseSegments = timeSegments.map(seg => ({
    start: seg.start,
    end: seg.end,
    text: seg.text
  }));

  console.log("Building segments in all languages");
  const targetLanguages = ["pl", "en", "es", "pt"];

  const allSrts = {};

  for (const lang of targetLanguages) {
    if (lang === baseLang) {
      console.log("Skipping translation to base language:", lang);
      allSrts[lang] = makeSrt(baseSegments);
    } else {
      console.log("Translating segments to", lang);
      const translated = await translateSegments(
        baseSegments,
        baseLang,
        lang
      );
      allSrts[lang] = makeSrt(translated);
    }
  }

  console.log("Saving SRT files")

  for (const lang of ["es", "pl", "en", "pt"]) {
    putSrt(bucket, baseName, lang, allSrts[lang])
  }
};

/**
 * Segmentation rules
 * - based on audio_segments only
 * - split if duration > maxDuration
 * - no text is lost
 */
const buildSegmentsFromAudio = (audioSegments, maxDuration = 2.0) => {
  const result = [];

  for (const seg of audioSegments) {
    const start = Number(seg.start_time);
    const end = Number(seg.end_time);
    const text = seg.transcript.trim();

    if (!text) continue;

    const duration = end - start;

    if (duration <= maxDuration) {
      result.push({ start, end, text });
      continue;
    }

    // Long segments are split after commas, fullstops, exclamation and question marks
    const parts = text.split(/(?<=[.!?,])\s+/);
    const partDuration = duration / parts.length;

    let currentStart = start;

    for (const part of parts) {
      const currentEnd = currentStart + partDuration;
      result.push({
        start: currentStart,
        end: currentEnd,
        text: part.trim()
      });
      currentStart = currentEnd;
    }
  }

  return result;
};

async function translateSegments(segments, source, target) {
  const result = [];

  for (const seg of segments) {
    const translated = await translateText(seg.text, source, target);
    result.push({
      start: seg.start,
      end: seg.end,
      text: translated
    });
  }

  return result;
}

const translateText = async (text, source, target) => {
  const cmd = new TranslateTextCommand({
    Text: text,
    SourceLanguageCode: source,
    TargetLanguageCode: target
  });
  const res = await translateClient.send(cmd);
  return res.TranslatedText;
};

const makeSrt = (segments) => {
  let srt = "";

  segments.forEach((seg, i) => {
    srt += `${i + 1}\n`;
    srt += `${toSrtTime(seg.start)} --> ${toSrtTime(seg.end)}\n`;
    srt += `${seg.text}\n\n`;
  });

  return srt;
};

const toSrtTime = (seconds) => {
  const ms = Math.floor((Number(seconds) % 1) * 1000);
  const total = Math.floor(Number(seconds));
  const s = total % 60;
  const m = Math.floor((total / 60) % 60);
  const h = Math.floor(total / 3600);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
};
