resource "aws_iam_role" "ingest" {
  name = "sebcel-transcribe-ingest-role-${var.environment}"

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
    Name = "sebcel-transcribe-ingest-role-${var.environment}"
  }
}

resource "aws_iam_policy" "ingest" {
  name = "sebcel-transcribe-ingest-policy-${var.environment}"

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
        Sid = "S3InputOutput"
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = [
          "arn:aws:s3:::sebcel-transcribe-bucket-${var.environment}/input/*"
        ]
      },
      {
        Sid = "Transcribe"
        Effect = "Allow"
        Action = [
          "transcribe:StartTranscriptionJob",
          "transcribe:GetTranscriptionJob"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "sebcel-transcribe-ingest-policy-${var.environment}"
  }
}

resource "aws_iam_role_policy_attachment" "ingest" {
  role       = aws_iam_role.ingest.name
  policy_arn = aws_iam_policy.ingest.arn
}
