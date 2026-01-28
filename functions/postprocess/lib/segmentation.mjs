/**
 * Segmentation rules
 * - based on audio_segments only
 * - split if duration > maxDuration
 * - no text is lost
 */
const buildSegmentsFromAudio = (audioSegments, maxDuration = 2.0) => {
  const result = [];

  for (const seg of audioSegments) {
    const start = Number(seg.start_time);
    const end = Number(seg.end_time);
    const text = seg.transcript.trim();

    if (!text) continue;

    const duration = end - start;

    if (duration <= maxDuration) {
      result.push({ start, end, text });
      continue;
    }

    // Long segments are split after commas, fullstops, exclamation and question marks
    const parts = text.split(/(?<=[.!?,])\s+/);
    const partDuration = duration / parts.length;

    let currentStart = start;

    for (const part of parts) {
      const currentEnd = currentStart + partDuration;
      result.push({
        start: currentStart,
        end: currentEnd,
        text: part.trim()
      });
      currentStart = currentEnd;
    }
  }

  return result;
};

export const segmentation = {
    buildSegmentsFromAudio 
}