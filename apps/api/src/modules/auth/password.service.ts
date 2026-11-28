import { Injectable, OnModuleInit } from '@nestjs/common';
import * as argon2 from 'argon2';
import { randomInt } from 'node:crypto';

/** argon2id hashing. Plain passwords are never stored or logged. */
@Injectable()
export class PasswordService implements OnModuleInit {
  /** Verified against when the email doesn't exist, so response time doesn't reveal which emails are registered. */
  private dummyHash = '';

  async onModuleInit() {
    this.dummyHash = await this.hash('dummy-password-for-timing-1');
  }

  hash(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  async verify(hash: string | null | undefined, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash || this.dummyHash, password) && !!hash;
    } catch {
      return false;
    }
  }

  /** Readable temporary password for admin-created accounts: 12 chars, always has letters and digits. */
  generateTemporary(): string {
    const letters = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'; // no l/I/O
    const digits = '23456789'; // no 0/1
    const all = letters + digits;
    const pick = (set: string) => set[randomInt(set.length)]!;
    const chars = [pick(letters), pick(letters), pick(digits), pick(digits)];
    while (chars.length < 12) chars.push(pick(all));
    for (let i = chars.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [chars[i], chars[j]] = [chars[j]!, chars[i]!];
    }
    return chars.join('');
  }
}
