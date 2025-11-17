let counter = 0;

export function nextTempId() {
  counter++;
  return `TMP-${counter}`;
}