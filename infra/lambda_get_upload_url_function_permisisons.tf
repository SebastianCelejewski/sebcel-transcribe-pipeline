resource "aws_lambda_permission" "allow_apigw_get_upload_url" {
  statement_id  = "AllowExecutionFromAPIGatewayGetUploadUrl"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_upload_url.function_name
  principal     = "apigateway.amazonaws.com"
}