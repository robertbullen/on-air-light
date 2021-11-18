import { Secrets, SecretsService } from './secrets-service';

export class MockSecretsService extends SecretsService {
	public constructor() {
		super({}, {});
	}

	public async getSecrets(): Promise<Secrets> {
		return {
			cryptoMasterKey: 'cryptoMasterKey',
			particleDeviceId: 'particleDeviceId',
			particlePassword: 'particlePassword',
			particleUsername: 'particleUserName',
			zoomClientId: 'zoomClientId',
		};
	}
}
