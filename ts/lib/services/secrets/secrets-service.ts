import { mask } from '../../logging';
import { Service } from '../service';

export interface Secrets {
	iftttClientId: string;
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

	public abstract getSecrets(): Promise<Secrets>;
}
