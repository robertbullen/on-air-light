import * as crypto from 'crypto';
import { functionName } from '../../logging';
import { MockSecretsService } from '../secrets/mock-secrets-service';
import { CryptoService } from './crypto-service';

describe(CryptoService, () => {
	const secretsService = new MockSecretsService();
	const cryptoService1 = new CryptoService({
		secretsService,
	});
	const cryptoService2 = new CryptoService({
		secretsService,
	});

	describe.each([
		{
			description: 'when a single instance is used',
			cryptoService1,
			cryptoService2: cryptoService1,
		},
		{
			description: 'when separate instances are used',
			cryptoService1,
			cryptoService2,
		},
	])('$description', (testCase) => {
		it(`${functionName(CryptoService.prototype.encrypt)} followed by ${functionName(
			CryptoService.prototype.decrypt,
		)} should round trip`, async () => {
			const expected: Buffer = crypto.randomBytes(64);
			const encrypted: Buffer = await testCase.cryptoService1.encrypt(expected);
			const actual: Buffer = await testCase.cryptoService2.decrypt(encrypted);
			expect(actual).toEqual(expected);
		});
	});
});
