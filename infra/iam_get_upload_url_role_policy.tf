resource "aws_iam_role" "get_upload_url" {
  name = "${local.resource_name_prefix}-get-upload-url-function-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "get_upload_url" {
  name = "${local.project_name}-get-upload-url-function-policy-${var.environment}"
  role = aws_iam_role.get_upload_url.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.shared.arn}/input/*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:*"
        ]
        Resource = "*"
      }
    ]
  })
}