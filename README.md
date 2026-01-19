# sebcel-transcribe-pipeline
Serverless web application for multilingual speech transcription and subtitle generation.

The project processes real-world audio and video recordings using an event-driven AWS architecture.
It automatically transcribes speech, detects the source language, translates content, and generates readable subtitle files.

This repository is designed as a learning and portfolio project, with emphasis on clean architecture, infrastructure as code, and production-style decisions.

## Features
- Upload audio/video files via web interface
- Automatic language detection (PL / PT-BR / ES / EN)
- Speech-to-text using AWS Transcribe
- Automatic translation using AWS Translate
- Output formats:
  - Plain text (.txt)
  - Subtitles (.srt)
- Subtitle segmentation optimized for readability (≤ 2s)
- Handles real-world mobile recordings (including VFR issues)
- Fully serverless, event-driven pipeline

## Architecture overview

Web App (React)
   │
   │  Presigned upload
   ▼
Amazon S3  /input/
   │
   │  ObjectCreated
   ▼
AWS Lambda function: Transcribe
   │
   │  AWS Transcribe output
   ▼
Amazon S3  /output/json/
   │
   │  ObjectCreated
   ▼
AWS Lambda function: Post-process
   │
   │  Translate + format
   ▼
Amazon S3  /output/txt/  /output/srt/
   │
   ▼
Web App (preview & download)

## Region & Language Support

The system is deployed in AWS São Paulo (sa-east-1), optimized for recordings from South America.

Supported language detection options:
- Portuguese (Brazil) — pt-BR
- Spanish (Latin America / Europe) — es-AR, es-MX, es-ES
- Polish — pl-PL
- English — en-US

The region choice is deliberate to improve transcription accuracy for Brazilian Portuguese and Latin American Spanish.

## Technology Stack
### Backend
- AWS Lambda — serverless compute
- AWS Transcribe — speech recognition
- AWS Translate — text translation
- Amazon S3 — storage and event triggers
- CloudWatch Logs — observability

### Infrastructure
- Terraform — Infrastructure as Code
- AWS IAM — least-privilege security
- Multi-environment setup (dev, test, prod)
- Region and environment fully parameterized

### CI/CD
- GitHub Actions
  - Terraform plan & apply
  - Frontend build pipeline
- Secrets managed via GitHub repository secrets

###Frontend
- React
- Static hosting (S3)
- Presigned S3 uploads
- Result preview and download

## Repository Structure

sebcel-transcribe-pipeline/
├── infra/                 # Terraform infrastructure
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── env/
│       ├── dev.tfvars
│       ├── test.tfvars
│       └── prod.tfvars
│
├── backend/
│   └── functions/
│       ├── transcribe/    # Starts Transcribe jobs
│       └── postprocess/   # Translate + TXT + SRT
│
├── frontend/              # React web app
│
├── .github/
│   └── workflows/         # GitHub Actions CI/CD
│
└── README.md

## Naming Conventions
All AWS resources follow a consistent naming pattern:

sebcel-transcribe-<component>-<environment>

Examples:
- sebcel-transcribe-input-dev
- sebcel-transcribe-postprocess-fn-prod
- sebcel-transcribe-output-test
This ensures clarity, safe parallel environments, and easy cleanup.

## Security Considerations
- Separate IAM role per function
- Least-privilege permissions
- No hard-coded credentials
- No public S3 write access
- Presigned URLs for uploads

## Deployment
Infrastructure is deployed using Terraform.
Environments are selected via tfvars files:

terraform apply -var-file=env/dev.tfvars

CI/CD pipelines are triggered via GitHub Actions.

## Project Scope & Intent
This project intentionally focuses on:
- real-world audio processing problems
- clean serverless architecture
- infrastructure automation
- learning Terraform and GitHub Actions

It intentionally does not include:
- user authentication
- multi-account AWS setup
- Step Functions orchestration (planned v2)
- real-time processing

## Possible Future Extensions
- Step Functions orchestration
- Job status persistence (DynamoDB)
- Subtitle preview player
- Additional output formats (DOCX, PDF)
- Language-specific subtitle styling

## Motivation
This project is based on real travel recordings from Europe and South America.
It aims to bridge language, audio, and cloud engineering, while remaining practical and production-oriented.
