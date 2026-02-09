import time

def wait_for_output(s3, base_name: str, txt: bool, srt: bool):
    transcription_output = f"output/json/{base_name}.json"
    txt_output = f"output/txt/{base_name}.pl.txt"
    srt_output = f"output/srt/{base_name}.pl.srt"

    print("Waiting for transcription to be completed")
    print(f"- json file: {transcription_output})")
    transcription_completed = False
    while True:
        ready = True

        if s3.exists(transcription_output) and not transcription_completed:
            print("Transcription completed successfully. Waiting for translation to be completed")
            if txt: print(f"- txt file: {txt_output}")
            if srt: print(f"- srt file: {srt_output}")
            transcription_completed = True

        if txt:
            ready &= s3.exists(txt_output)
        if srt:
            ready &= s3.exists(srt_output)

        if ready:
            print("Translation completed successfully")
            return

        time.sleep(3)
