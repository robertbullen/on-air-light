import { methodName } from '../logging';

export interface HealthCheckFailure {
	error: unknown;
	milliseconds: number;
	ok: false;
}

export interface HealthCheckSuccess<THealthCheckData = unknown> {
	data: THealthCheckData;
	milliseconds: number;
	ok: true;
}

export type HealthCheckResult<THealthCheckData = unknown> =
	| HealthCheckFailure
	| HealthCheckSuccess<THealthCheckData>;

export abstract class Service<
	TConfig extends object = object,
	TDependencies extends object = object,
	THealthCheckData = unknown,
> {
	protected constructor(
		protected readonly config: Readonly<TConfig>,
		protected readonly dependencies: Readonly<TDependencies>,
	) {
		Object.freeze(config);
		Object.freeze(dependencies);
	}

	public static async checkHealthOfAll(
		services: readonly Service[],
	): Promise<Record<string, HealthCheckResult>> {
		return Object.fromEntries<HealthCheckResult>(
			await Promise.all(
				services.map(
					async (service: Service): Promise<[string, HealthCheckResult]> => [
						Object.getPrototypeOf(service).constructor.name,
						await service.checkHealth(),
					],
				),
			),
		);
	}

	public abstract checkHealth(): Promise<HealthCheckResult<THealthCheckData>>;

	protected async doCheckHealth(
		test: () => Promise<THealthCheckData>,
	): Promise<HealthCheckResult<THealthCheckData>> {
		const prefix: string = this.methodName(this.checkHealth);
		console.info(prefix);

		let result: HealthCheckResult<THealthCheckData>;

		const start: number = Date.now();
		try {
			const success: HealthCheckSuccess<THealthCheckData> = {
				data: await test(),
				milliseconds: Date.now() - start,
				ok: true,
			};
			result = success;
		} catch (error) {
			const failure: HealthCheckFailure = {
				error,
				milliseconds: Date.now() - start,
				ok: false,
			};
			result = failure;
		}

		console.info(prefix, { result });
		return result;
	}

	protected methodName(method: Function): string {
		return methodName(this, method);
	}
}
