export const FEEDBACK_VIDEO_MAX_BYTES = 50 * 1024 * 1024;
const extensions: Record<string, string> = { 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm', 'video/x-m4v': 'm4v' };
export function feedbackVideoError(file: Pick<File, 'size' | 'type'>): 'format' | 'size' | null {
  if (!extensions[file.type]) return 'format';
  if (file.size < 1 || file.size > FEEDBACK_VIDEO_MAX_BYTES) return 'size';
  return null;
}
export function feedbackVideoPath(chatId: string, userId: string, file: Pick<File, 'type'>): string {
  const extension = extensions[file.type];
  if (!extension) throw new Error('Unsupported video');
  return `feedback/${chatId}/${userId}/${crypto.randomUUID()}.${extension}`;
}