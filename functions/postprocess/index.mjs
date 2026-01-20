import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});

const streamToString = async (stream) =>
  await new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (c) => chunks.push(c));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    stream.on("error", reject);
  });

export const handler = async (event) => {
  const record = event.Records[0];
  const bucket = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

  console.log("Postprocess triggered for:", key);

  if (!key.startsWith("output/json/") || !key.endsWith(".json")) {
    console.log("Not a Transcribe JSON, skipping");
    return;
  }

  const baseName = key
    .replace(/^output\/json\//, "")
    .replace(/\.json$/i, "");

  // 1. Read JSON
  const data = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  );
  const jsonString = await streamToString(data.Body);
  const transcription = JSON.parse(jsonString);

  const text =
    transcription?.results?.transcripts?.[0]?.transcript || "";

  if (!text) {
    console.log("No transcript text found, skipping");
    return;
  }

  // 2. Write TXT (na razie tylko jeden język – oryginalny)
  const txtKey = `output/txt/${baseName}.txt`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: txtKey,
      Body: text,
      ContentType: "text/plain; charset=utf-8",
    })
  );

  console.log("TXT written:", txtKey);

  // SRT i Translate dodamy w kolejnym kroku
};
