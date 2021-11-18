import * as assert from 'assert';
import * as crypto from 'crypto';
import { SecretsService } from '../secrets/secrets-service';
import { HealthCheckResult, Service } from '../service';

interface Config {
	algorithm: crypto.CipherGCMTypes;
	authTagLength: number;
	ivLength: number;
	keyLength: number;
	saltLength: number;
}

abstract class Config {
	public static get default(): Config {
		return {
			// GCM is an authenticated encryption mode that not only provides confidentiality but
			// also provides integrity in a secured way.
			algorithm: 'aes-256-gcm',

			// A 128-bit auth tag is recommended for GCM.
			authTagLength: 16,

			// NIST recommends a 96-bit bytes IV for GCM to promote interoperability, efficiency,
			// and simplicity of design.
			ivLength: 12,

			// The key size of 256 bits is taken from the algorithm's name.
			keyLength: 32,

			// Prevent rainbow table attacks.
			saltLength: 16,
		};
	}
}

interface Dependencies {
	secretsService: SecretsService;
}

interface HealthCheckData {
	input: string;
	output: string;
}

export class CryptoService extends Service<Config, Dependencies, HealthCheckData> {
	public constructor(dependencies: Readonly<Dependencies>) {
		super(Config.default, dependencies);

		this._keyPromise = (async (): Promise<Buffer> => {
			const salt: Buffer = crypto.randomBytes(this.config.saltLength);
			return crypto.scryptSync(
				(await this.dependencies.secretsService.getSecrets()).cryptoMasterKey,
				salt,
				this.config.keyLength,
			);
		})();
	}

	public checkHealth(): Promise<HealthCheckResult<HealthCheckData>> {
		return this.doCheckHealth(async (): Promise<HealthCheckData> => {
			const input = 'health-check';
			const encrypted: Buffer = await this.encrypt(Buffer.from(input, 'utf8'));
			const decrypted: Buffer = await this.decrypt(encrypted);
			const output: string = decrypted.toString('utf8');
			assert.strictEqual(output, input);
			return {
				input,
				output,
			};
		});
	}

	public async encrypt(data: Buffer): Promise<Buffer> {
		const iv: Buffer = crypto.randomBytes(this.config.ivLength);
		const cipher: crypto.CipherGCM = crypto.createCipheriv(
			this.config.algorithm,
			await this._keyPromise,
			iv,
			{ authTagLength: this.config.authTagLength },
		);
		const encryptedData: Buffer = Buffer.concat([cipher.update(data), cipher.final()]);
		const authTag: Buffer = cipher.getAuthTag();
		const encapsulatedData: Buffer = Buffer.concat([iv, encryptedData, authTag]);
		return encapsulatedData;
	}

	public async decrypt(encapsulatedData: Buffer): Promise<Buffer> {
		const iv: Buffer = encapsulatedData.slice(0, this.config.ivLength);
		const encryptedData: Buffer = encapsulatedData.slice(
			this.config.ivLength,
			-this.config.authTagLength,
		);
		const authTag: Buffer = encapsulatedData.slice(-this.config.authTagLength);
		const decipher: crypto.DecipherGCM = crypto.createDecipheriv(
			this.config.algorithm,
			await this._keyPromise,
			iv,
			{ authTagLength: this.config.authTagLength },
		);
		decipher.setAuthTag(authTag);
		const data: Buffer = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
		return data;
	}

	private readonly _keyPromise: Promise<Buffer>;
}
