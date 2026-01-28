import { TranscribeClient, StartTranscriptionJobCommand } from "@aws-sdk/client-transcribe";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import path from "path";

const transcribeClient = new TranscribeClient({});
const s3Client = new S3Client({});

export const handler = async (event, context) => {
  const eventRecord = event.Records[0];

  const bucket = eventRecord.s3.bucket.name;
  const key = decodeURIComponent(eventRecord.s3.object.key.replace(/\+/g, " "));
  const id = context.awsRequestId;

  console.log("Processing file:", key)

  if (!key.startsWith("input/")) {
    console.log("Not an input object, skipping:", key);
    return;
  }

  const extension = path.extname(key).slice(1).toLowerCase();

  if (!["mp3", "mp4", "wav", "flac"].includes(extension)) {
    throw new Error("Invalid media type, skipping:", key);
  }

  const fileUri = `s3://${bucket}/${key}`;
  const baseName = key
    .replace(/^input\//, "")
    .replace(/\.[^/.]+$/, "");

  const outputKey = `output/json/${baseName}.json`;

  if (await s3ObjectExists(s3Client, bucket, outputKey)) {
    console.log("Transcription already exists in", outputKey, ", skipping:", key);
    return;
  }

  const params = {
    IdentifyLanguage: true,
    LanguageOptions: ["es-ES", "pt-BR", "pl-PL", "en-US"],

    Media: { MediaFileUri: fileUri },
    MediaFormat: extension,
    TranscriptionJobName: `transcribe-${id}`,
    OutputBucketName: bucket,
    OutputKey: outputKey
  };

  await transcribeClient.send(new StartTranscriptionJobCommand(params));

  console.log("Started Transcribe job for", key);
};

async function s3ObjectExists(s3, bucket, key) {
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
