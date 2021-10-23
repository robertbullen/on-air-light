// TODO: Figure out why this error occurs even with servers/lib/types/particle-api-js.d.ts:
// "TS7016: Could not find a declaration file for module 'particle-api-js'"
// @ts-ignore
import Particle, { LoginResult } from 'particle-api-js';
import * as globalConfig from '../../global-config';
import { mask } from '../../logging';
import { Secrets, SecretsService } from '../secrets/secrets-service';
import { HealthCheckResult, Service } from '../service';

interface Dependencies {
	particle: Particle;
	secretsService: SecretsService;
}

export class ParticleAuthenticatorService extends Service<
	object,
	Dependencies,
	Particle.LoginResult
> {
	public constructor(dependencies: Readonly<Dependencies>) {
		super({}, dependencies);
		this.loginResultExpiry = 0;
		this.loginResultPromise = undefined;
	}

	public checkHealth(): Promise<HealthCheckResult<Particle.LoginResult>> {
		return this.doCheckHealth(async () =>
			ParticleAuthenticatorService.maskLoginResult(await this.login()),
		);
	}

	public async getAuthToken(): Promise<string> {
		if (!this.loginResultPromise || Date.now() >= this.loginResultExpiry) {
			this.loginResultPromise = this.login();
			this.loginResultExpiry = Number.MAX_VALUE;
			this.loginResultExpiry =
				Date.now() + (await this.loginResultPromise).body.expires_in * 1000;
		}
		return (await this.loginResultPromise).body.access_token;
	}

	private static maskLoginResult(loginResult: Particle.LoginResult): Particle.LoginResult {
		return {
			body: {
				...loginResult.body,
				access_token: mask(loginResult.body.access_token),
				refresh_token: mask(loginResult.body.refresh_token),
			},
			statusCode: loginResult.statusCode,
		};
	}

	private async login(): Promise<Particle.LoginResult> {
		const prefix: string = this.methodName(this.login);
		console.info(prefix);

		const secrets: Secrets = await this.dependencies.secretsService.getSecrets();
		const result: Particle.LoginResult = await this.dependencies.particle.login({
			password: secrets.particlePassword,
			tokenDuration: Math.round(globalConfig.cacheTtlMilliseconds / 1000),
			username: secrets.particleUsername,
		});

		const maskedResult: Particle.LoginResult =
			ParticleAuthenticatorService.maskLoginResult(result);
		console.info(prefix, { result: maskedResult });

		return result;
	}

	private loginResultExpiry: number;
	private loginResultPromise: Promise<LoginResult> | undefined;
}
