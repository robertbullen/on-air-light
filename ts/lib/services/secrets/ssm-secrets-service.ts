import { SSM } from 'aws-sdk';
import * as path from 'path';
import * as globalConfig from '../../../lib/global-config';
import { HealthCheckResult } from '../service';
import { Secrets, SecretsService } from './secrets-service';

interface Dependencies {
	ssm: SSM;
}

export class SsmSecretsService extends SecretsService<object, Dependencies> {
	public constructor(dependencies: Readonly<Dependencies>) {
		super({}, dependencies);
	}

	public checkHealth(): Promise<HealthCheckResult<Secrets>> {
		return this.doCheckHealth(async () =>
			SecretsService.maskSecrets(await this.getSecretsFromParameterStore()),
		);
	}

	public async getSecrets(): Promise<Secrets> {
		if (!this._secretsPromise || Date.now() > this._secretsExpiry) {
			this._secretsPromise = this.getSecretsFromParameterStore();
			this._secretsExpiry = Number.MAX_VALUE;
			await this._secretsPromise;
			this._secretsExpiry = Date.now() + globalConfig.cacheTtlMilliseconds;
		}
		return this._secretsPromise;
	}

	public static get ssmParameters(): Record<keyof Secrets, string> {
		function generateParameterPath(suffix: string): string {
			return path.posix.join(path.posix.sep, globalConfig.appName, suffix);
		}

		return {
			particleDeviceId: generateParameterPath('PARTICLE_DEVICE_ID'),
			particlePassword: generateParameterPath('PARTICLE_PASSWORD'),
			particleUsername: generateParameterPath('PARTICLE_USERNAME'),
			zoomClientId: generateParameterPath('ZOOM_CLIENT_ID'),
		};
	}

	private async getSecretsFromParameterStore(): Promise<Secrets> {
		const prefix: string = this.methodName(this.getSecretsFromParameterStore);
		console.info(prefix);

		const ssmParameters: Record<keyof Secrets, string> = SsmSecretsService.ssmParameters;
		const ssmParameterNames: string[] = Object.values(ssmParameters);

		const getParametersInput: SSM.GetParametersRequest = {
			Names: ssmParameterNames,
			WithDecryption: true,
		};
		const getParametersOutput: SSM.GetParametersResult = await this.dependencies.ssm
			.getParameters(getParametersInput)
			.promise();
		if (
			getParametersOutput.Parameters?.length !== ssmParameterNames.length ||
			getParametersOutput.InvalidParameters?.length
		) {
			throw new Error();
		}

		function findParameterValueOrThrow(parameterName: string): string {
			const parameter = getParametersOutput.Parameters?.find(
				(parameter) => parameter.Name === parameterName,
			);
			if (!parameter?.Value) {
				throw new Error();
			}
			return parameter.Value;
		}

		const result: Secrets = {
			particleDeviceId: findParameterValueOrThrow(ssmParameters.particleDeviceId),
			particlePassword: findParameterValueOrThrow(ssmParameters.particlePassword),
			particleUsername: findParameterValueOrThrow(ssmParameters.particleUsername),
			zoomClientId: findParameterValueOrThrow(ssmParameters.zoomClientId),
		};

		const maskedResult: Secrets = SsmSecretsService.maskSecrets(result);
		console.info(prefix, { result: maskedResult });

		return result;
	}

	private _secretsExpiry: number = 0;
	private _secretsPromise: Promise<Secrets> | undefined;
}
