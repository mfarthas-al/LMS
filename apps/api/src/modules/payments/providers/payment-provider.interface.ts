/**
 * Every online gateway (PayHere now; others later) implements this, so adding a
 * gateway never touches enrollment or access logic.
 */
export interface CheckoutSession {
  /** URL or form fields the client uses to redirect the student to the gateway. */
  redirectUrl?: string;
  formFields?: Record<string, string>;
}

export interface VerifiedNotification {
  orderId: string;
  providerReference: string;
  amountCents: number;
  currency: 'LKR';
  status: 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'PENDING';
}

export interface PaymentProvider {
  readonly name: string;
  createCheckout(input: {
    orderId: string;
    amountCents: number;
    description: string;
    customer: { name: string; email?: string; phone: string };
  }): Promise<CheckoutSession>;

  /**
   * Must verify the gateway signature. Throws if the signature, amount or
   * merchant ID do not match. Callers must process each orderId only once.
   */
  verifyNotification(payload: Record<string, string>): Promise<VerifiedNotification>;
}
