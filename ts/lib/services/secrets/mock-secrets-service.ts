import { Secrets, SecretsService } from './secrets-service';

export class MockSecretsService extends SecretsService<Secrets> {
	public constructor(config?: Readonly<Partial<Secrets>>) {
		super(
			{
				cryptoMasterKey: 'cryptoMasterKey',
				cryptoSalt: 'cryptoSalt',
				particleDeviceId: 'particleDeviceId',
				particlePassword: 'particlePassword',
				particleUsername: 'particleUserName',
				zoomClientId: 'zoomClientId',
				...config,
			},
			{},
		);
	}

	public async getSecrets(): Promise<Secrets> {
		return this.config;
	}
}
