data "aws_caller_identity" "current" {}

resource "aws_s3_bucket_policy" "allow_transcribe_access" {
  bucket = aws_s3_bucket.shared.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid = "AllowIngestFunctionCheckTranscribeOutput"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.ingest.arn
        }
        Action = "s3:GetObject"
        Resource = "${aws_s3_bucket.shared.arn}/output/json/*"
      },
      {
        Sid = "AllowPostprocessFunctionCheckTranslateOutput"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.postprocess.arn
        }
        Action = "s3:GetObject"
        Resource = "${aws_s3_bucket.shared.arn}/output/txt/*"
      },
      {
        Sid = "AllowIngestAndPostprocessFunctionsCheckBucketContents"
        Effect = "Allow"
        Principal = {
          AWS = [aws_iam_role.ingest.arn, aws_iam_role.postprocess.arn]
        }
        Action = "s3:ListBucket"
        Resource = aws_s3_bucket.shared.arn
      },
      {
        Sid    = "AllowTranscribeReadInput"
        Effect = "Allow"
        Principal = {
          Service = "transcribe.amazonaws.com"
        }
        Action = [
          "s3:GetObject"
        ]
        Resource = "arn:aws:s3:::${aws_s3_bucket.shared.bucket}/input/*"
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
        Resource = aws_s3_bucket.shared.arn
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
        Resource = "${aws_s3_bucket.shared.arn}/output/json/*"
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
        Resource = aws_s3_bucket.shared.arn
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}
