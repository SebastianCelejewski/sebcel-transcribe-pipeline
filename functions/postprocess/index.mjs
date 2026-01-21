import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({});

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

  console.log("Processing file:", key)

  if (!key.startsWith("output/json/") || !key.endsWith(".json")) {
    console.log("Not a JSON file, skipping:", key);
    return;
  }

  const baseName = key
    .replace(/^output\/json\//, "")
    .replace(/\.json$/i, "");

  const txtOutputKey = `output/txt/${baseName}.txt`;
  
  if (await s3ObjectExists(s3Client, bucket, txtOutputKey))
  {
    console.log("Text translation already exists in", txtOutputKey, ", skipping:", key);
    return;
  }

  const data = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const jsonString = await streamToString(data.Body);
  const transcription = JSON.parse(jsonString);

  const text = transcription?.results?.transcripts?.[0]?.transcript || "";

  if (!text) {
    console.log("No transcript text found, skipping");
    return;
  }

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: txtOutputKey,
      Body: text,
      ContentType: "text/plain; charset=utf-8",
    })
  );

  console.log("TXT written:", txtOutputKey);
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