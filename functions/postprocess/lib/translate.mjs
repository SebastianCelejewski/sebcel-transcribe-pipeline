import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";

const translateClient = new TranslateClient({ region: process.env.TRANSLATE_REGION });

const translateText = async (text, source, target) => {
  const cmd = new TranslateTextCommand({
    Text: text,
    SourceLanguageCode: source,
    TargetLanguageCode: target
  });
  const res = await translateClient.send(cmd);
  return res.TranslatedText;
};

export const translate = {
  translateText
}