import { passwordSchema } from '@lms/shared';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  beforeAll(() => service.onModuleInit());

  it('hashes with argon2id and verifies', async () => {
    const hash = await service.hash('Secret123');
    expect(hash.startsWith('$argon2id$')).toBe(true);
    await expect(service.verify(hash, 'Secret123')).resolves.toBe(true);
    await expect(service.verify(hash, 'secret123')).resolves.toBe(false);
  });

  it('returns false (not throws) for missing or malformed hashes', async () => {
    await expect(service.verify(null, 'anything')).resolves.toBe(false);
    await expect(service.verify(undefined, 'anything')).resolves.toBe(false);
    await expect(service.verify('not-a-hash', 'anything')).resolves.toBe(false);
  });

  it('generates temporary passwords that pass the password policy', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const pw = service.generateTemporary();
      expect(pw).toHaveLength(12);
      expect(passwordSchema.safeParse(pw).success).toBe(true);
      seen.add(pw);
    }
    expect(seen.size).toBe(200);
  });
});
