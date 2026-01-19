resource "aws_s3_bucket_notification" "ingest" {
  bucket = aws_s3_bucket.transcribe.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.ingest.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "input/"
  }

  depends_on = [
    aws_lambda_permission.allow_s3_ingest
  ]
}

resource "aws_lambda_permission" "allow_s3_ingest" {
  statement_id  = "AllowS3InvokeIngest"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ingest.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.transcribe.arn
}
