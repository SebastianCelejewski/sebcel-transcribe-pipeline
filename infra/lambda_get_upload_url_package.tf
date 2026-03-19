data "archive_file" "get_upload_url_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../functions/get_upload_url"
  output_path = "${path.module}/build/get-upload-url.zip"
}