resource "aws_lambda_function" "ingest" {
  function_name = "${local.resource_name_prefix}-ingest-function-${var.environment}"
  role          = aws_iam_role.ingest.arn
  runtime       = "nodejs22.x"
  handler       = "handler.handleEvent"

  filename         = data.archive_file.ingest_zip.output_path
  source_code_hash = data.archive_file.ingest_zip.output_base64sha256

  environment {
    variables = {
      OUTPUT_PREFIX = "output/json/"
    }
  }

  tags = {
    Name        = "${local.resource_name_prefix}-ingest-function-${var.environment}"
    application = "${local.project_name}"
    environment = var.environment
  }
}