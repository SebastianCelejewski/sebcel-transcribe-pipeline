resource "aws_lambda_function" "ingest" {
  function_name = "sebcel-transcribe-ingest-function-${var.environment}"
  role          = aws_iam_role.ingest.arn
  runtime       = "nodejs24.x"
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