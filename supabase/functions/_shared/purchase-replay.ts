export function purchaseTransactionId(raw: Record<string, unknown>, orderId: string, event: string): string {
  return typeof raw.transaction_id === 'string' && /^\d{1,20}$/.test(raw.transaction_id)
    ? raw.transaction_id : `${orderId}_${event}`;
}

export async function deliverPurchaseWelcomeOnce(
  claim: () => Promise<boolean>,
  send: () => Promise<void>,
  finish: (status: 'sent' | 'uncertain') => Promise<void>,
): Promise<'sent' | 'already_claimed' | 'uncertain'> {
  if (!await claim()) return 'already_claimed';
  try {
    await send();
  } catch {
    await finish('uncertain');
    return 'uncertain';
  }
  await finish('sent');
  return 'sent';
}