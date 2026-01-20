resource "aws_lambda_function" "postprocess" {
  function_name = "sebcel-transcribe-postprocess-function-${var.environment}"
  role          = aws_iam_role.postprocess.arn
  runtime       = "nodejs18.x"
  handler       = "index.handler"

  filename         = data.archive_file.postprocess_function.output_path
  source_code_hash = data.archive_file.postprocess_function.output_base64sha256

  timeout      = 30
  memory_size = 512

  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.shared.bucket
      ENVIRONMENT = var.environment
    }
  }

  tags = {
    Name        = "sebcel-transcribe-postprocess-function-${var.environment}"
    application = "sebcel-transcribe-service"
    environment = var.environment
  }
}
