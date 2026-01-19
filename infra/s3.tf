resource "aws_s3_bucket" "transcribe" {
  bucket = "sebcel-transcribe-bucket-${var.environment}"

  force_destroy = true

  tags = {
    Name = "sebcel-transcribe-bucket-${var.environment}"
  }
}

resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.transcribe.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  bucket = aws_s3_bucket.transcribe.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
