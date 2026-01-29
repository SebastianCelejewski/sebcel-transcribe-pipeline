# Lessons Learned – sebcel-transcribe-pipeline

This document describes **actual, observed AWS behavior** discovered while building the audio → transcription → post‑processing pipeline.

These are **verified conclusions**, not assumptions. They are based on:
- CloudTrail **Data Events** (S3)
- real runtime failures
- systematic comparison of IAM policies vs S3 bucket policies
- empirical behavior of AWS Transcribe and AWS Translate across regions

---

## 1. Transcribe performs a preliminary "write access check"

Before starting the actual transcription job, AWS Transcribe:
- attempts to write a temporary object:

  `output/json/.write_access_check_file.temp`

If this operation fails:
- the transcription job is **not started**
- Transcribe returns a **misleading error**:

```
BadRequestException: The specified S3 bucket can't be accessed
```

### Critical detail
Although Transcribe itself performs the S3 write, it also **validates that the caller** (the ingest Lambda) **has permission** to write to the target prefix.

➡️ The ingest Lambda **must have `s3:PutObject` on `output/json/*`**, even if:
- the Lambda never writes objects there itself

Without this permission:
- the write access check fails
- Transcribe surfaces a false `BadRequestException`

---

## 2. Permission validation ≠ execution identity

AWS Transcribe:
- validates whether the caller is *allowed* to reference the given S3 locations
- but **does not execute S3 operations as the caller**

CloudTrail may display the Lambda role ARN in the request context, but:
- this is **authorization context**, not execution identity
- the actual S3 actor remains `transcribe.amazonaws.com`

Confusing these two concepts leads to incorrect IAM conclusions.

---

## 3. IAM policy and bucket policy must both allow access

Access to S3 objects requires **both**:
1. an identity‑based policy (IAM role)
2. a resource‑based policy (S3 bucket policy)

If either one is missing:
- the request fails with `AccessDenied`
- or the failure is masked as a `BadRequestException`

### Debugging rule
- **CloudTrail S3 Data Events** are the only reliable source of truth
- Lambda CloudWatch logs alone are insufficient

---

## 4. S3 Event Notifications are strictly validated

When configuring S3 Event Notifications:
- S3 immediately validates the destination Lambda

If any of the following are missing or incorrect:
- `aws_lambda_permission`
- correct `source_arn`
- correct `source_account`

S3 fails with:
```
InvalidArgument: Unable to validate destination
```

➡️ Resource ordering and `depends_on` in Terraform are significant.

---

## 5. Terraform state ≠ actual AWS state

Terraform:
- compares **state vs configuration**
- does **not detect** manual changes made directly in AWS

Consequences:
- silent configuration drift
- false confidence in infrastructure correctness

### Recovery tools
- `terraform refresh`
- `terraform state rm`
- in critical situations: destroy / recreate

---

## 6. AWS regions differ in real capabilities

- AWS Transcribe works in `sa-east-1`
- AWS Translate does **not** operate in `sa-east-1`

Attempting to use the local endpoint:
```
translate.sa-east-1.amazonaws.com
```
results in:
```
ENOTFOUND
```

### Solution
- Explicitly use AWS Translate in `us-east-1`
- Set the region explicitly in the SDK client

---

## 7. Idempotency as a conscious design choice

Implemented mechanisms:
- deterministic output object keys
- `HeadObject` checks for artifact existence
- prefix‑based triggers to avoid recursive loops

Intentionally **not** implemented:
- hard idempotency locks

Testing strategy:
- delete generated artifacts
- re‑upload the same input file

---

## 8. Using CloudTrail Data events

AWS often:
- masks IAM and S3 permission errors as `BadRequestException`
- performs undocumented pre‑flight validations

➡️ **CloudTrail S3 Data Events are the only reliable debugging source** when S3 behavior appears illogical.

If an AWS error message makes no sense:
- the explanation is almost always in CloudTrail, not in the exception text.

