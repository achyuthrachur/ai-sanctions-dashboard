import type { ReapplyTransaction } from "@/types/index";

export const REL_COLOR = '#0065B3';  // relationship — blue
export const TRX_COLOR = '#C45A00';  // transaction — existing L2 orange

export function reapplyAlertType(t: ReapplyTransaction): 'relationship' | 'transaction' {
  return t.reapplyType === 'A' ? 'relationship' : 'transaction';
}
