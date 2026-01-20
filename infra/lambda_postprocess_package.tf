data "archive_file" "postprocess_function" {
  type        = "zip"
  source_dir  = "${path.module}/../functions/postprocess"
  output_path = "${path.module}/../terraform/postprocess.zip"
}
