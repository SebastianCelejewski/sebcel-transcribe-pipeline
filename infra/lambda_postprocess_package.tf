data "archive_file" "postprocess_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../functions/postprocess/src"
  output_path = "${path.module}/build/postprocess.zip"
}
