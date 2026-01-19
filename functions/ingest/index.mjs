import { TranscribeClient, StartTranscriptionJobCommand } from "@aws-sdk/client-transcribe";
import path from "path";

const transcribeClient = new TranscribeClient({});

export const handler = async (event, context) => {
  const eventRecord = event.Records[0];

  const bucket = eventRecord.s3.bucket.name;
  const key = decodeURIComponent(eventRecord.s3.object.key.replace(/\+/g, " "));
  const id = context.awsRequestId;

  console.log("bucket:", bucket)
  console.log("key:", key)
  console.log("id:", id)

  if (!key.startsWith("input/")) return;

  const extension = path.extname(key).slice(1).toLowerCase();
  console.log("extension", extension)

  if (!["mp3", "mp4", "wav", "flac"].includes(extension)) {
    throw new Error("Invalid media type");
  }

  const fileUri = `s3://${bucket}/${key}`;
  const baseName = key
    .replace(/^input\//, "")
    .replace(/\.[^/.]+$/, "");

  const outputKey = `output/json/${baseName}.json`;

  console.log("fileUri:", fileUri)
  console.log("baseName:", baseName)
  console.log("outputKey:", outputKey)

  const params = {
    IdentifyLanguage: true,
    LanguageOptions: ["es-ES", "pt-BR", "pl-PL", "en-US"],

    Media: { MediaFileUri: fileUri },
    MediaFormat: extension,
    TranscriptionJobName: `transcribe-${id}`,
    OutputBucketName: bucket,
    OutputKey: outputKey
  };
  
  console.log("Params:", JSON.stringify(params))

  await transcribeClient.send(new StartTranscriptionJobCommand(params));

  console.log("Started Transcribe job for", key);
};
