import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { generateKey, ItemKey, KeyLabel, keyName } from '../../dynamodb';
import { UserState, UserStateKey } from './user-states';
import { UserStatesService } from './user-states-service';

interface Config {
	tableName: string;
}

interface Dependencies {
	documentClient: DocumentClient;
}

export class DynamoDbUserStatesService extends UserStatesService<Config, Dependencies> {
	public constructor(config: Readonly<Config>, dependencies: Readonly<Dependencies>) {
		super(config, dependencies);
	}

	public async createUserState(userState: UserState): Promise<UserStateKey> {
		const prefix: string = this.methodName(this.createUserState);
		console.info(prefix, { userState });

		const userStateItem: UserStateItem = UserStateItem.fromUserState(userState);
		const putItemInput: DocumentClient.PutItemInput = {
			Item: userStateItem,
			TableName: this.config.tableName,
		};
		await this.dependencies.documentClient.put(putItemInput).promise();
		const userStateKey: UserStateKey = ItemKey.encode(userStateItem);

		console.info(prefix, { result: userStateKey });
		return userStateKey;
	}

	public async readUserState(userStateKey: UserStateKey): Promise<UserState | undefined> {
		const prefix: string = this.methodName(this.readUserState);
		console.info(prefix, { userStateKey });

		const itemKey: ItemKey = ItemKey.decode(userStateKey);
		const getItemInput: DocumentClient.GetItemInput = {
			Key: itemKey,
			TableName: this.config.tableName,
		};
		const getItemOutput: DocumentClient.GetItemOutput = await this.dependencies.documentClient
			.get(getItemInput)
			.promise();
		const userState = getItemOutput.Item?.userState as UserState | undefined;

		console.info(prefix, { result: userState });
		return userState;
	}

	public async readUserStates(userId: string): Promise<UserState[]> {
		const prefix: string = this.methodName(this.readUserStates);
		console.info(prefix, { userId });

		// Query for all user items with sort keys starting with 'SVC'.
		const queryInput: DocumentClient.QueryInput = {
			ExpressionAttributeNames: {
				'#primaryKey': keyName<ItemKey>('primaryKey'),
				'#sortKey': keyName<ItemKey>('sortKey'),
			},
			ExpressionAttributeValues: {
				':primaryKey': generateKey([KeyLabel.userId, userId]),
				':sortKeyHead': KeyLabel.sourceServiceName,
			},
			KeyConditionExpression:
				'#primaryKey = :primaryKey and begins_with(#sortKey, :sortKeyHead)',
			TableName: this.config.tableName,
		};
		const queryOutput: DocumentClient.QueryOutput = await this.dependencies.documentClient
			.query(queryInput)
			.promise();
		const userStates: UserState[] = (
			(queryOutput.Items as UserStateItem[] | undefined) ?? []
		).map(UserStateItem.toUserState);

		console.info(prefix, { result: userStates });
		return userStates;
	}
}

interface UserStateItem extends ItemKey {
	userState: UserState;
}

abstract class UserStateItem {
	public static fromUserState(userState: UserState): UserStateItem {
		return {
			primaryKey: generateKey([KeyLabel.userId, userState.userId]),
			sortKey: generateKey(
				[KeyLabel.sourceServiceName, userState.source.serviceName],
				[KeyLabel.sourceDeviceId, userState.source.deviceId],
			),
			userState,
		};
	}

	public static toUserState(userStateItem: UserStateItem): UserState {
		return userStateItem?.userState;
	}
}
