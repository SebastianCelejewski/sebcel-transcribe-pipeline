resource "aws_lambda_function" "postprocess" {
  function_name = "${local.resource_name_prefix}-postprocess-function-${var.environment}"
  role          = aws_iam_role.postprocess.arn
  runtime       = "nodejs22.x"
  handler       = "handler.handleEvent"

  filename         = data.archive_file.postprocess_zip.output_path
  source_code_hash = data.archive_file.postprocess_zip.output_base64sha256

  timeout      = 30
  memory_size = 512

  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.shared.bucket
      ENVIRONMENT = var.environment
      TRANSLATE_REGION = "us-east-1"
    }
  }

  tags = {
    Name        = "${local.resource_name_prefix}-postprocess-function-${var.environment}"
    application = "${local.project_name}"
    environment = var.environment
  }
}
