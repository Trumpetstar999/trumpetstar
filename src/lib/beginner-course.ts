export { beginnerShowcases } from '../../supabase/functions/_shared/beginner-showcases';
export function orderedBeginnerVideos<T extends { sort_order: number }>(videos: T[]): T[] {
  return [...videos].sort((a, b) => a.sort_order - b.sort_order);
}