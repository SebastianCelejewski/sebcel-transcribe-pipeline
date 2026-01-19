terraform {
  backend "s3" {
    bucket         = "sebcel-transcribe-tfstate-dev"
    key            = "infra/terraform.tfstate"
    region         = "sa-east-1"
    dynamodb_table = "sebcel-transcribe-tf-lock-dev"
    encrypt        = true
  }
}
