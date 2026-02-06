from pathlib import Path
import typer
from .s3_client import S3Client
from .wait import wait_for_output

app = typer.Typer()

BUCKET = "sebcel-transcribe-shared-bucket-dev"

@app.command()
def transcribe(
    file: Path,
    profile: str = "cicd",
    wait: bool = True,
):
    typer.echo(f"Starting transcription for {file}")
    
    if not file.exists():
        typer.echo("File does not exist. Terminating.")
        raise typer.Exit(1)

    typer.echo("Creating S3 client")
    s3 = S3Client(bucket=BUCKET, profile=profile)

    key = f"input/{file.name}"
    s3.upload(str(file), key)

    typer.echo("Waiting for output files to be generated")

    base_name = file.stem

    if wait:
        wait_for_output(s3, base_name, txt=True, srt=True)

    typer.echo("Downloading output files")
    s3.download(
        f"output/txt/{base_name}.pl.txt",
        f"{base_name}.pl.txt",
    )

    typer.echo("Done")
