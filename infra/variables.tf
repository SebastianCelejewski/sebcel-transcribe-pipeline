variable "environment" {
  description = "Deployment environment (dev, test, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "sa-east-1"
}
