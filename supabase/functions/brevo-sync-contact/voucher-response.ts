/** Keep provider diagnostics structural: never echo raw response text, which may contain credentials. */
export function voucherResponse(status: number, body: unknown, expectedCode?: string) {
  const parsed = body && typeof body === 'object' ? body as Record<string, unknown> : null;
  const data = parsed?.data && typeof parsed.data === 'object' ? parsed.data as Record<string, unknown> : null;
  // Current official schema returns data.discount_code_id + data.code without requiring a result field.
  const identified = !!expectedCode && data?.code === expectedCode && Number(data.discount_code_id) > 0;
  const success = status >= 200 && status < 300 && (parsed?.result === 'success' || identified);
  const explicitFailure = parsed?.result === 'error' || parsed?.result === 'failure' || parsed?.result === 'failed';
  return { ok: success, status, uncertain: !success && !explicitFailure,
    diagnostic: explicitFailure ? 'Provider explicitly rejected voucher creation' : 'Provider result unconfirmed' };
}