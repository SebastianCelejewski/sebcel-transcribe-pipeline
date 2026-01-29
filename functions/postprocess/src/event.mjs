export function decodeKey(record) {
  return decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
}