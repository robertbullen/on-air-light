import { HealthCheckResult, Service } from '../service';
import { UserState, UserStateAndKey, UserStateKey } from './user-states';

export abstract class UserStatesService<
	TConfig extends object = object,
	TDependencies extends object = object,
> extends Service<TConfig, TDependencies, UserStateAndKey> {
	public static createHealthCheckUserState(): UserState {
		return {
			activity: 'absent',
			eventKey: 'health-check',
			source: {
				deviceId: 'health-check',
				serviceName: 'health-check',
			},
			timestamp: new Date(0).toISOString(),
			userId: 'health-check',
			version: 1,
		};
	}

	public checkHealth(): Promise<HealthCheckResult<UserStateAndKey>> {
		return this.doCheckHealth(async () => {
			const userState: UserState = UserStatesService.createHealthCheckUserState();
			const userStateKey: UserStateKey = await this.createUserState(userState);

			return {
				userState,
				userStateKey,
			};
		});
	}

	public abstract createUserState(userState: UserState): Promise<UserStateKey>;
	public abstract readUserState(userStateKey: UserStateKey): Promise<UserState | undefined>;
	public abstract readUserStates(userId: string): Promise<UserState[]>;
}
