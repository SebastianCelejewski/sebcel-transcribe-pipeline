import { s3 } from "./lib/s3.mjs";
import { translate } from "./lib/translate.mjs";
import { segmentation } from "./lib/segmentation.mjs";
import { srt } from "./lib/srt.mjs";

const generateSrtFiles = async (bucket, baseName, requiredLanguages, transcription) => {
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

const getBaseLang = (transcription) => {
  const detectedLangFull = transcription.results.language_code || "es-ES";
  const baseLang = detectedLangFull.slice(0, 2);
  return baseLang;
}

const buildBaseSegments = (transcription) => {
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

const prepareSrtTranslations = async (baseSegments, baseLang, requiredLanguages) => {
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

const translateSegments = async (segments, source, target) => {
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

const saveSrtFiles = async (bucket, baseName, requiredLanguages, srtTranslations) => {
  console.log("Saving srt files")
  for (const lang of requiredLanguages) {
    const key = `output/srt/${baseName}.${lang}.srt`
    const text = srtTranslations[lang]
    s3.putSrt(bucket, key, text)
  }
}

export const srtProcessing = {
  generateSrtFiles
}