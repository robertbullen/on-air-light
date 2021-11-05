// TODO: Figure out why this error occurs even with servers/lib/types/particle-api-js.d.ts:
// "TS7016: Could not find a declaration file for module 'particle-api-js'"
// @ts-ignore
import Particle, { Variable } from 'particle-api-js';
import { SecretsService } from '../secrets/secrets-service';
import { HealthCheckResult } from '../service';
import { Color, OnAirLightService, OnAirLightState, Pattern } from './on-air-light-service';
import { ParticleAuthenticatorService } from './particle-authenticator-service';

interface Config {
	deviceId: string;
}

interface Dependencies {
	particle: Particle;
	particleAuthenticatorService: ParticleAuthenticatorService;
	secretsService: SecretsService;
}

export class ParticleOnAirLightService extends OnAirLightService<Config, Dependencies> {
	public constructor(config: Readonly<Config>, dependencies: Readonly<Dependencies>) {
		super(config, dependencies);
	}

	public checkHealth(): Promise<HealthCheckResult<OnAirLightState>> {
		return this.doCheckHealth(() => this.getState());
	}

	public async getState(): Promise<OnAirLightState> {
		const prefix = this.methodName(this.getState);
		console.info(prefix);

		const [color, duration, pattern] = await Promise.all([
			this._color.get(),
			this._duration.get(),
			this._pattern.get(),
		]);

		const result: OnAirLightState = {
			color,
			duration,
			pattern,
		};
		console.info(prefix, { result });

		return result;
	}

	public async setState(state: Partial<OnAirLightState>): Promise<OnAirLightState> {
		const prefix: string = this.methodName(this.setState);
		console.info(prefix, { state });

		const [color, duration, pattern] = await Promise.all([
			this._color.setOrGet(state.color, true),
			this._duration.setOrGet(state.duration),
			this._pattern.setOrGet(state.pattern),
		]);

		const result: OnAirLightState = {
			color,
			duration,
			pattern,
		};
		console.info(prefix, { result });

		return result;
	}

	private readonly _color = new ParticleProperty<Color>(
		this.dependencies.particle,
		this.dependencies.particleAuthenticatorService,
		this.config.deviceId,
		'color',
	);
	private readonly _duration = new ParticleProperty<number>(
		this.dependencies.particle,
		this.dependencies.particleAuthenticatorService,
		this.config.deviceId,
		'duration',
	);
	private readonly _pattern = new ParticleProperty<Pattern>(
		this.dependencies.particle,
		this.dependencies.particleAuthenticatorService,
		this.config.deviceId,
		'pattern',
	);
}

const CallFunctionResultCode = {
	unchanged: 0,
	changed: 1,
	failed: -1,
} as const;

type CallFunctionResultCode = typeof CallFunctionResultCode[keyof typeof CallFunctionResultCode];

/**
 * An abstraction around a Particle variable/function pair that act as a property accessor/mutator.
 */
class ParticleProperty<T extends Variable> {
	public constructor(
		private readonly _particle: Particle,
		private readonly _particleAuthenticatorService: ParticleAuthenticatorService,
		private readonly _deviceId: string,
		private readonly _propertyName: string,
	) {}

	public async get(): Promise<T> {
		return (
			await this._particle.getVariable<T>({
				auth: await this._particleAuthenticatorService.getAuthToken(),
				deviceId: this._deviceId,
				name: this._propertyName,
			})
		).body.result;
	}

	public async set(value: T): Promise<CallFunctionResultCode> {
		return (
			await this._particle.callFunction({
				argument: value.toString(),
				auth: await this._particleAuthenticatorService.getAuthToken(),
				deviceId: this._deviceId,
				name: `set${this._propertyName}`,
			})
		).body.return_value as CallFunctionResultCode;
	}

	/**
	 * Sets the property to the given `value`, if supplied, and then returns the latest value. When
	 * `forceGet` is true, the latest value is retrieved via the accessor in case `value` is not
	 * accepted or is changed on the remote device.
	 */
	public async setOrGet(value?: T, forceGet: boolean = false): Promise<T> {
		let newValue: T | undefined;

		if (value !== undefined) {
			if ((await this.set(value)) !== CallFunctionResultCode.failed) {
				newValue = value;
			}
		}

		if (forceGet || newValue === undefined) {
			newValue = await this.get();
		}

		return newValue;
	}
}
