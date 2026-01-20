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
        Sid = "Transcribe"
        Effect = "Allow"
        Action = [
          "transcribe:StartTranscriptionJob"
        ]
        Resource = [
          "*"
        ]
      },
      {
        Sid = "BucketMetadata"
        Effect = "Allow"
        Action = "s3:GetBucketLocation"
        Resource = aws_s3_bucket.shared.arn
      },
      {
        Sid = "ReadInputObject"
        Effect = "Allow"
        Action = "s3:GetObject"
        Resource = "${aws_s3_bucket.shared.arn}/input/*"
      },
      {
        Sid = "TranscribeOutputValidation"
        Effect = "Allow"
        Action = "s3:PutObject"
        Resource = "${aws_s3_bucket.shared.arn}/output/json/*"
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
