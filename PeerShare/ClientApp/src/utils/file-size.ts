export function fileSize(size: number) {
  let ext = "bytes";

  if (size >= 1024) {
    size /= 1024;
    ext = "KB";
  }
  if (size >= 1024) {
    size /= 1024;
    ext = "MB";
  }
  if (size >= 1024) {
    size /= 1024;
    ext = "GB";
  }

  return `${Math.round(size * 10) / 10} ${ext}`;
}
