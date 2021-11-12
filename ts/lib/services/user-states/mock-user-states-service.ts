import { UserState, UserStateKey } from './user-states';
import { UserStatesService } from './user-states-service';

type Config = object;
type Dependencies = object;

export class MockUserStatesService extends UserStatesService<Config, Dependencies> {
	public constructor() {
		super({}, {});
	}

	public async createUserState(userState: UserState): Promise<UserStateKey> {
		const prefix: string = this.methodName(this.createUserState);
		console.info(prefix, { userState });

		const userStateKey: UserStateKey = [
			userState.userId,
			userState.source.serviceName,
			userState.source.deviceId,
		].join(':');
		this.userStates.set(userStateKey, userState);

		console.info(prefix, { result: userStateKey });
		return userStateKey;
	}

	public async readUserState(userStateKey: UserStateKey): Promise<UserState | undefined> {
		const prefix: string = this.methodName(this.readUserState);
		console.info(prefix, { userStateKey });

		const userState: UserState | undefined = this.userStates.get(userStateKey);

		console.info(prefix, { result: userState });
		return userState;
	}

	public async readUserStates(userId: string): Promise<UserState[]> {
		const prefix: string = this.methodName(this.readUserStates);
		console.info(prefix, { userId });

		const userStates: UserState[] = Array.from(this.userStates.values()).filter(
			(userState: UserState): boolean => userState.userId === userId,
		);

		console.info(prefix, { result: userStates });
		return userStates;
	}

	private readonly userStates = new Map<UserStateKey, UserState>();
}
