resource "aws_s3_bucket" "shared" {
  bucket = "sebcel-transcribe-shared-bucket-${var.environment}"

  force_destroy = true

  tags = {
    Name = "sebcel-transcribe-shared-bucket-${var.environment}"
  }
}

resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.shared.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  bucket = aws_s3_bucket.shared.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
