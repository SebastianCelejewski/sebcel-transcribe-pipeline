export function extractBaseName(key) {
  return key.replace(/^output\/json\//, "").replace(/\.json$/i, "");
}

export function isJsonFile(key) {
  return key.startsWith("output/json/") && key.endsWith(".json");
}