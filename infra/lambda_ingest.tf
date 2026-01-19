resource "aws_lambda_function" "ingest" {
  function_name = "sebcel-transcribe-ingest-function-${var.environment}"
  role          = aws_iam_role.ingest.arn
  runtime       = "nodejs18.x"
  handler       = "index.handler"

  filename         = data.archive_file.ingest_zip.output_path
  source_code_hash = data.archive_file.ingest_zip.output_base64sha256

  environment {
    variables = {
      OUTPUT_BUCKET = aws_s3_bucket.transcribe.bucket
      OUTPUT_PREFIX = "output/json/"
    }
  }
}

