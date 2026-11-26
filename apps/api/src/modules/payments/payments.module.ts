import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PayHereProvider } from './providers/payhere/payhere.provider';
import { ManualPaymentService } from './manual/manual-payment.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PayHereProvider, ManualPaymentService],
  exports: [PaymentsService, ManualPaymentService],
})
export class PaymentsModule {}
