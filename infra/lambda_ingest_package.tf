data "archive_file" "ingest_function" {
  type        = "zip"
  source_dir  = "${path.module}/../functions/ingest"
  output_path = "${path.module}/../functions/ingest/dist/ingest.zip"
}
