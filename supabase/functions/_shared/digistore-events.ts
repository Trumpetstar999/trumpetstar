export const EVENT_TYPE_MAP: Record<string, string> = {
  on_payment: 'PURCHASE', on_payment_complete: 'PURCHASE', payment: 'PURCHASE', order_complete: 'PURCHASE',
  on_rebill_resumed: 'RENEWAL', on_rebill: 'RENEWAL', rebilling: 'RENEWAL', rebill_payment: 'RENEWAL',
  on_rebill_cancelled: 'CANCELLATION', on_refund_request: 'CANCELLATION', subscription_cancelled: 'CANCELLATION', cancel: 'CANCELLATION',
  on_refund: 'REFUND', refund: 'REFUND', refund_complete: 'REFUND', on_chargeback: 'CHARGEBACK', chargeback: 'CHARGEBACK',
  on_upgrade: 'PURCHASE', on_upgrade_complete: 'PURCHASE', on_payment_missed: 'PAYMENT_MISSED',
};

// Cancellation/missed payment never grant access, including when the period end is absent.
export function entitlementTransition(event: string, periodEnd: string | null) {
  switch (event) {
    case 'PURCHASE':
    case 'RENEWAL': return { active: true, valid_until: periodEnd, status: 'active', cancel_at_period_end: false };
    case 'CANCELLATION': return { active: false, valid_until: periodEnd, status: 'cancelled', cancel_at_period_end: false };
    case 'REFUND': return { active: false, valid_until: periodEnd, status: 'refunded', cancel_at_period_end: false };
    case 'CHARGEBACK': return { active: false, valid_until: periodEnd, status: 'chargeback', cancel_at_period_end: false };
    case 'PAYMENT_MISSED': return { active: false, valid_until: periodEnd, status: 'expired', cancel_at_period_end: false };
    default: return null;
  }
}