data "archive_file" "postprocess_function" {
  type        = "zip"
  source_dir  = "${path.module}/../functions/postprocess/src"
  output_path = "${path.module}/../functions/postprocess/dist/postprocess.zip"
}
