import * as crypto from 'crypto';
import { MockSecretsService } from '../secrets/mock-secrets-service';
import { CryptoService } from './crypto-service';

describe(CryptoService, () => {
	it('encryption and decryption should round trip', async () => {
		const cryptoService = new CryptoService({
			secretsService: new MockSecretsService(),
		});

		const expected: Buffer = crypto.randomBytes(64);
		const encrypted: Buffer = await cryptoService.encrypt(expected);
		const actual: Buffer = await cryptoService.decrypt(encrypted);
		expect(actual).toEqual(expected);
	});
});
