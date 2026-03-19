resource "aws_lambda_function" "get_upload_url" {
  function_name = "${local.resource_name_prefix}-get-upload-url-function-${var.environment}"

  filename         = data.archive_file.get_upload_url_zip.output_path
  source_code_hash = data.archive_file.get_upload_url_zip.output_base64sha256

  handler = "index.handler"
  runtime = "nodejs20.x"

  role = aws_iam_role.get_upload_url.arn

  environment {
    variables = {
      BUCKET = aws_s3_bucket.shared.id
    }
  }
}