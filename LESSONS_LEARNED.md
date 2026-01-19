# How AWS Transcribe Uses the Caller’s IAM Role

This section explains **how and why AWS Transcribe is able to perform S3 operations using the caller’s IAM role**, even though the transcription job itself is executed asynchronously and ultimately runs as the service principal `transcribe.amazonaws.com`.

The behavior is non-obvious, poorly documented, and easy to misunderstand.

---

## What does NOT happen

Before explaining what actually happens, it is important to rule out common misconceptions.

### Transcribe SDK inside Lambda

AWS Transcribe does **not** run as a library inside the Lambda function.

The AWS SDK in Lambda:
- only sends a control-plane API request (`StartTranscriptionJob`)
- does not participate in any data-plane operations
- does not proxy S3 access

After the API call returns, the Lambda runtime is no longer involved.

### Transcribe assuming the Lambda execution role

AWS Transcribe does **not** explicitly assume the Lambda execution role via `sts:AssumeRole`, nor does it receive the role via `iam:PassRole`.

There is no role chaining or role delegation in the usual IAM sense.

---

## What actually happens

AWS Transcribe operates in **two distinct phases**, each with a different security context.

---

## Phase 1: Validation (caller context)

When `StartTranscriptionJob` is called, AWS Transcribe first performs a **validation phase**.

The purpose of this phase is to answer the question:

> “Is the caller allowed to reference and write to this S3 location?”

To do this, Transcribe performs a write-access check by attempting to create a temporary object: output/json/.write_access_check_file.temp

output/json/.write_access_check_file.temp


### Security context

This S3 operation is executed using:
- the **STS session identity of the caller**
- the **same IAM role that invoked `StartTranscriptionJob`**

CloudTrail data events show this clearly:
- `userIdentity.type = AssumedRole`
- the role ARN matches the Lambda execution role
- `invokedBy = transcribe.amazonaws.com`

This is not role assumption — it is **control-plane propagation of the caller’s identity**.

If this validation write fails:
- the transcription job is rejected
- AWS returns a generic `BadRequestException`
- the execution phase never begins

---

## Phase 2: Execution (service principal)

Only after validation succeeds does AWS Transcribe begin the actual transcription job.

During execution:
- input media is read from S3
- output files are written to S3
- all S3 access is performed as the service principal: transcribe.amazonaws.com


At this stage:
- the Lambda execution role is no longer relevant
- permissions are evaluated **only** against the S3 bucket policy

---

## Why AWS uses this model

This two-phase model exists for security reasons.

Without validation:
- any principal with `transcribe:StartTranscriptionJob`
- could cause Transcribe to write objects into arbitrary S3 buckets

By validating S3 access using the caller’s identity, AWS ensures:
- the caller is authorized to reference the target bucket and prefix
- privilege escalation via Transcribe is not possible

This pattern is similar to how AWS validates:
- `iam:PassRole`
- `kms:Decrypt` permissions
- resource references in `ec2:RunInstances`

---

## Key takeaway

AWS Transcribe does **not** assume the Lambda execution role.

However, **it validates S3 access using the caller’s STS identity before executing the job as a service principal**.

This distinction explains why:
- the Lambda role requires `s3:PutObject` on the output prefix
- missing that permission causes `BadRequestException`
- bucket policy alone is not sufficient

---

## Summary

- Validation phase → caller IAM role
- Execution phase → `transcribe.amazonaws.com`
- Both IAM role permissions and bucket policy must be correct
- CloudTrail data events are the only reliable way to observe this behavior




