/** Keep provider diagnostics structural: never echo raw response text, which may contain credentials. */
export function voucherResponse(status: number, body: unknown) {
  const parsed = body && typeof body === 'object' ? body as Record<string, unknown> : null;
  const success = status >= 200 && status < 300 && parsed?.result === 'success';
  const explicitFailure = parsed?.result === 'error' || parsed?.result === 'failure' || parsed?.result === 'failed';
  return { ok: success, status, uncertain: !success && !explicitFailure,
    diagnostic: explicitFailure ? 'Provider explicitly rejected voucher creation' : 'Provider result unconfirmed' };
}