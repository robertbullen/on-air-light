declare module 'particle-api-js' {
	export interface Params {
		context?: object;
		headers?: Record<string, string>;
	}

	export interface AuthParams extends Params {
		auth: string;
	}

	export interface CallFunctionParams extends AuthParams {
		argument: string;
		deviceId: string;
		name: string;
		product?: string;
	}

	export interface CallFunctionResult {
		body: {
			connected: boolean;
			id: string;
			return_value: number;
		};
		statusCode: number;
	}

	export interface GetVariableParams extends AuthParams {
		deviceId: string;
		name: string;
		product?: string;
	}

	export type Variable = boolean | number | string;

	export interface GetVariableResult<T extends Variable> {
		body: {
			cmd: 'VarReturn';
			name: string;
			result: T;
			coreInfo: {
				last_heard: string;
				connected: boolean;
				last_handshake_at: string;
				deviceID: string;
				product_id: number;
			};
		};
		statusCode: number;
	}

	export interface LoginParams extends Params {
		password: string;
		tokenDuration?: number;
		username: string;
	}

	export interface LoginResult {
		body: {
			token_type: 'bearer';
			access_token: string;
			expires_in: number;
			refresh_token: string;
		};
		statusCode: number;
	}

	class Particle {
		tokenDuration?: number;
		public callFunction(params: CallFunctionParams): Promise<CallFunctionResult>;
		public getVariable<T extends Variable>(
			params: GetVariableParams,
		): Promise<GetVariableResult<T>>;
		public login(params: LoginParams): Promise<LoginResult>;
	}

	export = Particle;
}
