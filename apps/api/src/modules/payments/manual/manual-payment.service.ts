import { Injectable } from '@nestjs/common';

/**
 * Manual (bank deposit / online transfer) payments:
 * 1. Student uploads a slip image/PDF to private storage (size + type checked).
 * 2. Payment is created with status PENDING_REVIEW.
 * 3. Admin approves or rejects (AdminModule). Approval grants the enrollment
 *    in the same DB transaction and writes an audit log entry.
 */
@Injectable()
export class ManualPaymentService {}
