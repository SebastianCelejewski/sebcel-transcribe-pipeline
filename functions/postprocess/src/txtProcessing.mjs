import { translate } from "./lib/translate.mjs";
import { s3 } from "./lib/s3.mjs";

const generateTextFiles = async (bucket, baseName, requiredLanguages, transcription) => {
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

const getBaseLang = (transcription) => {
  const detectedLangFull = transcription.results.language_code || "es-ES";
  const baseLang = detectedLangFull.slice(0, 2);
  return baseLang;
}

const prepareTxtTranslations = async (originalText, baseLang, requiredLanguages) => {
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

const saveTxtFiles = async (bucket, baseName, requiredLanguages, txtTranslations) => {
  console.log("Saving text files")
  for (const lang of requiredLanguages) {
    const key = `output/txt/${baseName}.${lang}.txt`
    const text = txtTranslations[lang]
    s3.putTxt(bucket, key, text)
  }
}

export const txtProcessing = {
  generateTextFiles   
}