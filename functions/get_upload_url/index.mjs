import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({});

export const handler = async (event) => {
  const userId = event.requestContext.authorizer.claims.sub;

  const fileName = `input/${userId}/${Date.now()}.mp3`;

  const command = new PutObjectCommand({
    Bucket: process.env.BUCKET,
    Key: fileName,
    ContentType: "audio/mpeg"
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 300 });

  return {
    statusCode: 200,
    body: JSON.stringify({
      uploadUrl: url,
      key: fileName
    })
  };
};