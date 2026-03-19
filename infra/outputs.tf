output "upload_api_url" {
  value = "${aws_apigatewayv2_api.upload_api.api_endpoint}/upload"
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.users.id
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.client.id
}