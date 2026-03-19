resource "aws_apigatewayv2_api" "upload_api" {
  name          = "${local.resource_name_prefix}-upload-api-${var.environment}"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id          = aws_apigatewayv2_api.upload_api.id
  authorizer_type = "JWT"
  name = "${local.resource_name_prefix}-cognito-authorizer-${var.environment}"

  identity_sources = ["$request.header.Authorization"]

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.client.id]
    issuer = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.users.id}"
  }
}

resource "aws_apigatewayv2_integration" "get_upload_url_integration" {
  api_id = aws_apigatewayv2_api.upload_api.id

  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.get_upload_url.invoke_arn
}

resource "aws_apigatewayv2_route" "get_upload_url_route" {
  api_id    = aws_apigatewayv2_api.upload_api.id
  route_key = "POST /get-upload-url"

  target = "integrations/${aws_apigatewayv2_integration.get_upload_url_integration.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_stage" "upload_stage" {
  api_id      = aws_apigatewayv2_api.upload_api.id
  name        = "$default"
  auto_deploy = true
}

