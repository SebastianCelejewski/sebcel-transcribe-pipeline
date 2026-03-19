data "archive_file" "ingest_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../functions/ingest/src"
  output_path = "${path.module}/build/ingest.zip"
}
