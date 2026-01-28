const makeSrt = (segments) => {
  let srt = "";

  segments.forEach((seg, i) => {
    srt += `${i + 1}\n`;
    srt += `${toSrtTime(seg.start)} --> ${toSrtTime(seg.end)}\n`;
    srt += `${seg.text}\n\n`;
  });

  return srt;
};

const toSrtTime = (seconds) => {
  const ms = Math.floor((Number(seconds) % 1) * 1000);
  const total = Math.floor(Number(seconds));
  const s = total % 60;
  const m = Math.floor((total / 60) % 60);
  const h = Math.floor(total / 3600);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
};

export const srt = {
    makeSrt
}