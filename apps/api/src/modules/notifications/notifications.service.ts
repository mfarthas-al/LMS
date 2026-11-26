import { Injectable } from '@nestjs/common';

/** SMS and email sending (provider-agnostic), queued via BullMQ. */
@Injectable()
export class NotificationsService {}
