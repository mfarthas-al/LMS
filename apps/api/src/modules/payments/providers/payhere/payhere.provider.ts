import { Injectable, NotImplementedException } from '@nestjs/common';
import type {
  CheckoutSession,
  PaymentProvider,
  VerifiedNotification,
} from '../payment-provider.interface';

/**
 * PayHere (https://www.payhere.lk) integration.
 * - Checkout: build the signed form (hash = MD5 of merchant_id + order_id + amount + currency + MD5(secret)).
 * - Notify: verify md5sig against our own calculation, check amount + currency match the stored order,
 *   then mark the payment SUCCESS and grant the enrollment in one DB transaction.
 */
@Injectable()
export class PayHereProvider implements PaymentProvider {
  readonly name = 'payhere';

  async createCheckout(): Promise<CheckoutSession> {
    throw new NotImplementedException();
  }

  async verifyNotification(): Promise<VerifiedNotification> {
    throw new NotImplementedException();
  }
}
