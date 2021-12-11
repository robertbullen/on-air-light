import * as fs from 'fs';
import * as path from 'path';
import { locationIdGlobal } from '../user-locations/user-locations';
import { UserState } from './user-states';
import { UserStatesService } from './user-states-service';

interface Config {
	baseDirPath: string;
}

type Dependencies = object;

type UserStateKey = string;

export class FsUserStatesService extends UserStatesService<UserStateKey, Config, Dependencies> {
	public constructor(config: Readonly<Config>) {
		super(config, {});
	}

	public async createUserState(userState: UserState): Promise<string> {
		const prefix: string = this.methodName(this.createUserState);
		console.info(prefix, { userState });

		const dirPath: string = path.join(this.config.baseDirPath, 'users', userState.userId);
		const fileName = `${userState.locationId}_${userState.source.serviceName}_${userState.source.deviceId}.json`;
		const filePath: string = path.join(dirPath, fileName);
		const relFilePath: string = path.relative(this.config.baseDirPath, filePath);

		await fs.promises.mkdir(dirPath, { recursive: true });

		const userStateJson: string = JSON.stringify(userState, undefined, '\t');
		await fs.promises.writeFile(filePath, userStateJson);

		const userStateKey: UserStateKey = relFilePath;
		console.info(prefix, { result: userStateKey });
		return userStateKey;
	}

	public async readUserState(userStateKey: UserStateKey): Promise<UserState | undefined> {
		const prefix: string = this.methodName(this.readUserState);
		console.info(prefix, { userStateKey });

		const relFilePath: string = userStateKey;
		const userState: UserState | undefined = await this.readUserStateFromFile(relFilePath);

		console.info(prefix, { result: userState });
		return userState;
	}

	public async readUserStates(userId: string, locationId?: string): Promise<UserState[]> {
		const prefix: string = this.methodName(this.readUserStates);
		console.info(prefix, { userId, locationId });

		const dirPath: string = path.join(this.config.baseDirPath, 'users', userId);
		const fileNames: string[] = await fs.promises.readdir(dirPath);
		const filteredRelFilePaths: string[] = fileNames
			.filter(
				(fileName) =>
					!locationId ||
					fileName.startsWith(locationId) ||
					fileName.startsWith(locationIdGlobal),
			)
			.map((fileName) =>
				path.relative(this.config.baseDirPath, path.join(dirPath, fileName)),
			);

		const userStates: UserState[] = (
			await Promise.all(
				filteredRelFilePaths.map((relFilePath) => this.readUserStateFromFile(relFilePath)),
			)
		).filter((userState: UserState | undefined): userState is UserState => !!userState);

		console.info(prefix, { result: userStates });
		return userStates;
	}

	private async readUserStateFromFile(relFilePath: string): Promise<UserState | undefined> {
		const userStateFilePath: string = path.resolve(this.config.baseDirPath, relFilePath);

		let userStateJson: string;
		try {
			userStateJson = await fs.promises.readFile(userStateFilePath, 'utf8');
		} catch (error) {
			if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
				return undefined;
			}
			throw error;
		}

		const userState = JSON.parse(userStateJson) as UserState;
		return userState;
	}
}
