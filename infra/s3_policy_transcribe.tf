data "aws_caller_identity" "current" {}

resource "aws_s3_bucket_policy" "allow_transcribe_access" {
  bucket = aws_s3_bucket.transcribe.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowTranscribeReadInput"
        Effect = "Allow"

        Principal = {
          Service = "transcribe.amazonaws.com"
        }

        Action = [
          "s3:GetObject"
        ]

        Resource = "arn:aws:s3:::${aws_s3_bucket.transcribe.bucket}/input/*"

        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AllowTranscribeListInputPrefix"
        Effect = "Allow"

        Principal = {
          Service = "transcribe.amazonaws.com"
        }

        Action   = ["s3:ListBucket"]
        Resource = "arn:aws:s3:::${aws_s3_bucket.transcribe.bucket}"

        Condition = {
          StringLike = {
            "s3:prefix" = ["input/*"]
          }
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AllowTranscribeWriteOutput"
        Effect = "Allow"

        Principal = {
          Service = "transcribe.amazonaws.com"
        }

        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]

        Resource = "arn:aws:s3:::${aws_s3_bucket.transcribe.bucket}/output/json/*"

        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AllowTranscribeBucketMetadata"
        Effect = "Allow"

        Principal = {
          Service = "transcribe.amazonaws.com"
        }

        Action = [
          "s3:GetBucketLocation"
        ]

        Resource = "arn:aws:s3:::${aws_s3_bucket.transcribe.bucket}"

        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}
