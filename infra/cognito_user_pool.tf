resource "aws_cognito_user_pool" "users" {
  name = "${local.resource_name_prefix}-user-pool-${var.environment}"
}

resource "aws_cognito_user_pool_client" "client" {
  name         = "mobile-client"
  user_pool_id = aws_cognito_user_pool.users.id

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]
}