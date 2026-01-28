import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({});

export async function s3ObjectExists(bucket, key) {
    console.log("Checking if object", key, "exists in", bucket);
    try {
        await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        return true;
    } catch (e) {
        if (e.name === "NotFound") {
            return false;
        }
        throw e;
    }
}

export async function getJson(bucket, key) {
    console.log("Getting JSON", key, "from", bucket);
    const data = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const jsonString = await streamToString(data.Body);
    const transcription = JSON.parse(jsonString);
    return transcription
}

export async function putTxt(bucket, key, text) {
    console.log("Putting TXT", key, "to", bucket);
    await s3Client.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: text,
            ContentType: "text/plain; charset=utf-8",
        })
    );
}

export async function putSrt(bucket, baseName, language, srtText) {
    const key = `output/srt/${language}/${baseName}.srt`
    console.log("Putting SRT", key, "to", bucket);
    await s3Client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: allSrts[lang],
        ContentType: "application/x-subrip; charset=utf-8"
    }));
}

const streamToString = async (stream) =>
  await new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (c) => chunks.push(c));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    stream.on("error", reject);
  });