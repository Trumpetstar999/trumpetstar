import { describe, expect, it } from 'vitest';
import { deliverPurchaseWelcomeOnce, purchaseTransactionId } from '../../supabase/functions/_shared/purchase-replay';

describe('controlled purchase replay', () => {
  it('preserves provider transaction 134385531 instead of creating an order alias', () => {
    expect(purchaseTransactionId({ transaction_id: '134385531' }, '2JCSH6VL', 'PURCHASE')).toBe('134385531');
  });
  it('retains legacy identity for notifications without a transaction ID', () => {
    expect(purchaseTransactionId({}, '2JCSH6VL', 'PURCHASE')).toBe('2JCSH6VL_PURCHASE');
  });
  it('sends exactly one purchase welcome across two calls', async () => {
    let claimed = false; let mails = 0;
    const claim = async () => { if (claimed) return false; claimed = true; return true; };
    const send = async () => { mails++; };
    const states: string[] = [];
    const finish = async (state: string) => { states.push(state); };
    expect(await deliverPurchaseWelcomeOnce(claim, send, finish)).toBe('sent');
    expect(await deliverPurchaseWelcomeOnce(claim, send, finish)).toBe('already_claimed');
    expect(mails).toBe(1); expect(states).toEqual(['sent']);
  });
  it('does not send another mail after an ambiguous delivery', async () => {
    let claimed = false; let mails = 0;
    const claim = async () => { if (claimed) return false; claimed = true; return true; };
    const send = async () => { mails++; throw new Error('connection lost'); };
    const states: string[] = [];
    const finish = async (state: string) => { states.push(state); };
    expect(await deliverPurchaseWelcomeOnce(claim, send, finish)).toBe('uncertain');
    expect(await deliverPurchaseWelcomeOnce(claim, send, finish)).toBe('already_claimed');
    expect(mails).toBe(1); expect(states).toEqual(['uncertain']);
  });
});