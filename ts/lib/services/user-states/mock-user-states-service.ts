import { locationIdWildcard } from '../user-locations/user-locations';
import { UserState } from './user-states';
import { UserStatesService } from './user-states-service';

type Config = object;
type Dependencies = object;

export class MockUserStatesService extends UserStatesService<string, Config, Dependencies> {
	public constructor() {
		super({}, {});
	}

	public override async createUserState(userState: UserState): Promise<string> {
		const prefix: string = this.methodName(this.createUserState);
		console.info(prefix, { userState });

		const userStateKey: string = [
			userState.userId,
			userState.locationId,
			userState.source.serviceName,
			userState.source.deviceId,
		].join(':');
		this.userStates.set(userStateKey, userState);

		console.info(prefix, { result: userStateKey });
		return userStateKey;
	}

	public override async readUserState(userStateKey: string): Promise<UserState | undefined> {
		const prefix: string = this.methodName(this.readUserState);
		console.info(prefix, { userStateKey });

		const userState: UserState | undefined = this.userStates.get(userStateKey);

		console.info(prefix, { result: userState });
		return userState;
	}

	public override async readUserStates(
		userId: string,
		locationId?: string,
	): Promise<UserState[]> {
		const prefix: string = this.methodName(this.readUserStates);
		console.info(prefix, { userId });

		const userStates: UserState[] = Array.from(this.userStates.values()).filter(
			(userState: UserState): boolean =>
				userState.userId === userId &&
				(!locationId ||
					userState.locationId === locationId ||
					userState.locationId === locationIdWildcard),
		);

		console.info(prefix, { result: userStates });
		return userStates;
	}

	private readonly userStates = new Map<string, UserState>();
}
