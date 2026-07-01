export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0 sec';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hr`);
  if (minutes > 0) parts.push(`${minutes} min`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} sec`);

  return parts.join(' ');
}
