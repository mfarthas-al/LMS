import { Injectable } from '@nestjs/common';

/** Payment orchestration: online (PayHere) auto-grants access on verified webhook; manual (bank slip) waits for admin approval. */
@Injectable()
export class PaymentsService {}
