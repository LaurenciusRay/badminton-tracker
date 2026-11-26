export function rewardProgress(total: number) {
  return total === 0 ? 0 : (total - 1) % 4 + 1;
}
