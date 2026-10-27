export interface LoyaltyData {
  points: number;
  check_ins_count: number;
  progress_to_next_reward: number;
  points_needed: number;
  rewards_earned?: number;
  recent_check_ins: Array<{ event_name: string; points: number; date: string }>;
}

const positiveNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : fallback;

export function normalizeLoyalty(data: Record<string, unknown>): LoyaltyData {
  const points = positiveNumber(data.points ?? data.loyalty_points);
  return {
    points,
    check_ins_count: positiveNumber(data.check_ins_count ?? data.checkins_count),
    progress_to_next_reward: Math.min(points / 25 * 100, 100),
    points_needed: Math.max(25 - points, 0),
    rewards_earned: typeof data.rewards_earned === 'number' ? positiveNumber(data.rewards_earned) : undefined,
    recent_check_ins: Array.isArray(data.recent_check_ins) ? data.recent_check_ins : [],
  };
}

export interface FreeEntryVoucher { id: string; code: string; used: boolean }

export function normalizeVoucher(data: unknown): FreeEntryVoucher | null {
  if (!data || typeof data !== 'object') return null;
  const voucher = data as { id?: unknown; code?: unknown; used?: boolean; expires_at?: string };
  if (typeof voucher.id !== 'string' || !voucher.id || voucher.used) return null;
  if (voucher.expires_at && new Date(voucher.expires_at).getTime() <= Date.now()) return null;
  // The scanner accepts the voucher ID; the API does not return a separate code.
  return { id: voucher.id, code: voucher.id, used: false };
}
