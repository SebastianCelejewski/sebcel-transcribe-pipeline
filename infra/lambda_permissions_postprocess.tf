resource "aws_lambda_permission" "allow_s3_invoke_postprocess" {
  statement_id  = "AllowExecutionFromS3TranscribeJson"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.postprocess.function_name
  principal     = "s3.amazonaws.com"

  source_arn     = "${aws_s3_bucket.transcribe.arn}/output/json/*"
  source_account = data.aws_caller_identity.current.account_id
}
