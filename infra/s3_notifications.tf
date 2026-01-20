resource "aws_s3_bucket_notification" "transcribe" {
  bucket = aws_s3_bucket.transcribe.id

  lambda_function {
    id                  = "ingest"
    lambda_function_arn = aws_lambda_function.ingest.arn
    events              = ["s3:ObjectCreated:*"]

    filter_prefix = "input/"
  }

  lambda_function {
    id                  = "postprocess"
    lambda_function_arn = aws_lambda_function.postprocess.arn
    events              = ["s3:ObjectCreated:*"]

    filter_prefix = "output/json/"
  }

  depends_on = [
    aws_lambda_permission.allow_s3_invoke_ingest,
    aws_lambda_permission.allow_s3_invoke_postprocess
  ]
}
