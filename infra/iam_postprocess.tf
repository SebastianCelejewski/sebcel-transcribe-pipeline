resource "aws_iam_role" "postprocess" {
  name = "sebcel-transcribe-postprocess-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "sebcel-transcribe-postprocess-role-${var.environment}"
  }
}

resource "aws_iam_policy" "postprocess" {
  name = "sebcel-transcribe-postprocess-policy-${var.environment}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Sid = "S3ReadTranscribeJson"
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = [
          "arn:aws:s3:::sebcel-transcribe-bucket-${var.environment}/output/json/*"
        ]
      },
      {
        Sid = "S3WriteTextOutputs"
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = [
          "arn:aws:s3:::sebcel-transcribe-bucket-${var.environment}/output/txt/*",
          "arn:aws:s3:::sebcel-transcribe-bucket-${var.environment}/output/srt/*"
        ]
      },
      {
        Sid = "Translate"
        Effect = "Allow"
        Action = [
          "translate:TranslateText"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "sebcel-transcribe-postprocess-policy-${var.environment}"
  }
}

resource "aws_iam_role_policy_attachment" "postprocess" {
  role       = aws_iam_role.postprocess.name
  policy_arn = aws_iam_policy.postprocess.arn
}
