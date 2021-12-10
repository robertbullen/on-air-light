import { HealthCheckResult, Service } from '../service';
import { UserState, UserStateAndKey } from './user-states';

export abstract class UserStatesService<
	TUserStateKey = unknown,
	TConfig extends object = object,
	TDependencies extends object = object,
> extends Service<TConfig, TDependencies, UserStateAndKey> {
	public static createHealthCheckUserState(): UserState {
		return {
			activities: [],
			eventKey: 'health-check',
			locationId: 'health-check',
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
			const userStateKey: TUserStateKey = await this.createUserState(userState);

			return {
				userState,
				userStateKey,
			};
		});
	}

	public abstract createUserState(userState: UserState): Promise<TUserStateKey>;
	public abstract readUserState(userStateKey: TUserStateKey): Promise<UserState | undefined>;
	public abstract readUserStates(userId: string, locationId?: string): Promise<UserState[]>;
}
