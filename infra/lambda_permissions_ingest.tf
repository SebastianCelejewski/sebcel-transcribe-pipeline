resource "aws_lambda_permission" "allow_s3_invoke_ingest" {
  statement_id  = "AllowExecutionFromS3Input"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ingest.function_name
  principal     = "s3.amazonaws.com"

  source_arn     = "${aws_s3_bucket.transcribe.arn}/input/*"
  source_account = data.aws_caller_identity.current.account_id
}
