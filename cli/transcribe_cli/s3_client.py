from botocore.exceptions import ClientError
import boto3

class S3Client:
    def __init__(self, bucket: str, profile: str | None = None):
        session = (
            boto3.Session(profile_name=profile)
            if profile
            else boto3.Session()
        )
        self._s3 = session.client("s3")
        self._bucket = bucket

    def upload(self, local_path: str, key: str):
        print("Uploading input file to S3")
        print(f"- audio file: {local_path}")
        self._s3.upload_file(local_path, self._bucket, key)
        print("Upload completed")

    def download(self, key: str, local_path: str):
        self._s3.download_file(self._bucket, key, local_path)

    def exists(self, key: str) -> bool:
        try:
            self._s3.head_object(Bucket=self._bucket, Key=key)
            return True
        except ClientError:
            return False
