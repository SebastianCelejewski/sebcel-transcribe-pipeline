@echo off
setlocal ENABLEDELAYEDEXPANSION

REM ==== CONFIG ====
set BUCKET=sebcel-transcribe-shared-bucket-dev

REM ==== INPUT FILE ====
set INPUT_FILE=%~1
set AWS_PROFILE=%2

if "%INPUT_FILE%"=="" (
  echo ERROR: No input file provided
  echo Usage: transcribe.bat path\to\file.mp3 aws_profile_name
  exit /b 1
)

if "%AWS_PROFILE%"=="" (
  echo ERROR: No AWS profile provided
  echo Usage: transcribe.bat path\to\file.mp3 aws_profile_name
  exit /b 1
)

REM ==== DERIVE BASE NAME ====
REM %~n1  -> filename without extension
REM %~x1  -> extension (not used further)
REM %~dp1 -> directory path (not used)
set BASE=%~n1

echo Input file: %INPUT_FILE%
echo Base name:  %BASE%
echo AWS profile name: %AWS_PROFILE%

REM ==== CLEANUP OUTPUTS ====
aws s3 rm s3://%BUCKET%/output/json/%BASE%.json --profile %AWS_PROFILE%
aws s3 rm s3://%BUCKET%/output/txt/%BASE%.txt --profile %AWS_PROFILE%
aws s3 rm s3://%BUCKET%/output/srt/%BASE%.srt --profile %AWS_PROFILE%

REM ==== CLEANUP INPUT ====
aws s3 rm s3://%BUCKET%/input/%BASE%.mp3 --profile %AWS_PROFILE%

REM ==== UPLOAD INPUT AGAIN ====
aws s3 cp "%INPUT_FILE%" s3://%BUCKET%/input/%BASE%.mp3 --profile %AWS_PROFILE%

echo Done.
endlocal
