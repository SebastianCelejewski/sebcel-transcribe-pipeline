resource "aws_lambda_function" "ingest" {
  function_name = "sebcel-transcribe-ingest-function-${var.environment}"
  role          = aws_iam_role.ingest.arn
  runtime       = "nodejs18.x"
  handler       = "index.handler"

  filename         = data.archive_file.ingest_function.output_path
  source_code_hash = data.archive_file.ingest_function.output_base64sha256

  environment {
    variables = {
      OUTPUT_PREFIX = "output/json/"
    }
  }

  tags = {
    Name        = "sebcel-transcribe-ingest-function-${var.environment}"
    application = "sebcel-transcribe-service"
    environment = var.environment
  }
}

resource "aws_lambda_permission" "allow_s3_ingest" {
  statement_id  = "AllowS3InvokeIngest"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ingest.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.transcribe.arn
}