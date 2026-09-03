/**
 * Custom card capture is disabled unless explicitly enabled in Vercel.
 * Encryption alone does not remove PCI obligations; enable only after a
 * compliant payment workflow has been approved.
 */
export function isPaymentCaptureEnabled(): boolean {
  return process.env.PAYMENT_CAPTURE_ENABLED?.trim().toLowerCase() === 'true';
}
