import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({});

const objectExists = async (bucket, key) => {
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

const getJson = async (bucket, key) => {
    console.log("Getting JSON", key, "from", bucket);
    const data = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const jsonString = await streamToString(data.Body);
    return jsonString;
}

const putTxt = async (bucket, key, text) => {
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

const putSrt = async (bucket, key, text) => {
    console.log("Putting SRT", key, "to", bucket);
    await s3Client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: text,
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

export const s3 = {
    objectExists,
    getJson,
    putTxt,
    putSrt
}
