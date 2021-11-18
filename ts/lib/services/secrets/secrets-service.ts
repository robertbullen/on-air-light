import { mask } from '../../logging';
import { HealthCheckResult, Service } from '../service';

export interface Secrets {
	cryptoMasterKey: string;
	particleDeviceId: string;
	particlePassword: string;
	particleUsername: string;
	zoomClientId: string;
}

export abstract class SecretsService<
	TConfig extends object = object,
	TDependencies extends object = object,
> extends Service<TConfig, TDependencies, Secrets> {
	public static maskSecrets(secrets: Secrets): Secrets {
		const maskedSecrets: Secrets = { ...secrets };
		for (const k in maskedSecrets) {
			const key = k as keyof Secrets;
			maskedSecrets[key] = mask(secrets[key]);
		}
		return maskedSecrets;
	}

	public checkHealth(): Promise<HealthCheckResult<Secrets>> {
		return this.doCheckHealth(async () => SecretsService.maskSecrets(await this.getSecrets()));
	}

	public abstract getSecrets(): Promise<Secrets>;
}
