import { Secrets, SecretsService } from './secrets-service';

export class EnvSecretsService extends SecretsService<object, object> {
	public constructor() {
		super({}, {});
	}

	public async getSecrets(): Promise<Secrets> {
		const prefix: string = this.methodName(this.getSecrets);
		console.info(prefix);

		function getEnvVariableOrThrow(name: string): string {
			const value: string | undefined = process.env[name];
			if (value === undefined) {
				throw new Error(`Required environment variable '${name}' is not defined'`);
			}
			return value;
		}

		const result: Secrets = {
			cryptoMasterKey: getEnvVariableOrThrow('CRYPTO_MASTER_KEY'),
			cryptoSalt: getEnvVariableOrThrow('CRYPTO_SALT'),
			particleDeviceId: getEnvVariableOrThrow('PARTICLE_DEVICE_ID'),
			particlePassword: getEnvVariableOrThrow('PARTICLE_PASSWORD'),
			particleUsername: getEnvVariableOrThrow('PARTICLE_USERNAME'),
			zoomClientId: getEnvVariableOrThrow('ZOOM_CLIENT_ID'),
		};

		const maskedResult: Secrets = EnvSecretsService.maskSecrets(result);
		console.info(prefix, { result: maskedResult });

		return result;
	}
}
