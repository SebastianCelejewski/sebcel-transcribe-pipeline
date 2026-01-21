import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";

const s3Client = new S3Client({});
const translateClient = new TranslateClient({
  region: process.env.TRANSLATE_REGION
});

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

  const data = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const jsonString = await streamToString(data.Body);
  const transcription = JSON.parse(jsonString);

  if (await s3ObjectExists(s3Client, bucket, txtOutputKey))
  {
    console.log("Text translation already exists in", txtOutputKey, ", skipping:", key);
  } 
  else 
  {
    console.log("Fetching full text");
    const text = transcription?.results?.transcripts?.[0]?.transcript || "";
  
    if (!text) {
      console.log("No transcript text found, skipping");
      return;
    }
  
    console.log("Saving full text to a txt file")
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: txtOutputKey,
        Body: text,
        ContentType: "text/plain; charset=utf-8",
      })
    );
  
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
    const key = `output/srt/${lang}/${baseName}.srt`
    console.log("Saving", key);
    await s3Client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: allSrts[lang],
      ContentType: "application/x-subrip; charset=utf-8"
    }));

    console.log("Saved", lang);
  }

};

async function s3ObjectExists(s3, bucket, key) {
  console.log("Checking if object",key,"exists in",bucket);
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (e) {
    if (e.name === "NotFound") {
      return false;
    }
    throw e;
  }
}

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

const streamToString = async (stream) =>
  await new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (c) => chunks.push(c));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    stream.on("error", reject);
  });

const toSrtTime = (seconds) => {
  const ms = Math.floor((Number(seconds) % 1) * 1000);
  const total = Math.floor(Number(seconds));
  const s = total % 60;
  const m = Math.floor((total / 60) % 60);
  const h = Math.floor(total / 3600);
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")},${String(ms).padStart(3,"0")}`;
};
