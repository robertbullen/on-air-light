import {
	DocumentClient,
	GetItemInput,
	GetItemOutput,
	Key,
	PutItemInput,
	PutItemInputAttributeMap,
} from 'aws-sdk/clients/dynamodb';
import { generateKey, ItemKey, KeyLabel } from '../../dynamodb';
import { Event, EventKey, EventsService } from './events-service';

interface Config {
	tableName: string;
}

interface Dependencies {
	documentClient: DocumentClient;
}

/**
 *
 * | PK         | SK                       | Data                                                            |
 * | ---------- | ------------------------ | --------------------------------------------------------------- |
 * | EVT:0000   | TST:${}#EID:adsfasdfsdaf | `{ ... }`                                                       |
 * | USR:Robert | LOC:Office               | `{ "eventKey": "eventId:eventId", "universalFormat": { ... } }` |
 * | USR:Robert | APP:Zoom                 | `{ "eventKey": "eventId:eventId", "universalFormat": { ... } }` |
 * | USR:Robert | APP:CameraWatcher        | `{ "eventKey": "eventId:eventId", "universalFormat": { ... } }` |
 *
 * - DynamoDB stores both individual events as-is and user state records in a normalized format
 * - Health checks can be accomplished by writing and then reading a single event with a well-known key
 * - Normalized formats should be versioned
 */
export class DynamoDbEventsService extends EventsService<Config, Dependencies> {
	public constructor(config: Readonly<Config>, dependencies: Readonly<Dependencies>) {
		super(config, dependencies);
	}

	public async createEvent(event: Event): Promise<EventKey> {
		const prefix: string = this.methodName(this.createEvent);
		console.info(prefix, { event });

		const eventItem: EventItem = toEventItem(event);

		const putItemInput: PutItemInput = {
			Item: eventItem as unknown as PutItemInputAttributeMap,
			TableName: this.config.tableName,
		};
		/* const putItemOutput: PutItemOutput = */ await this.dependencies.documentClient
			.put(putItemInput)
			.promise();

		const eventKey: EventKey = DynamoDbEventsService.encodeEventKey(eventItem);
		console.info(prefix, { result: eventKey });
		return eventKey;
	}

	public async readEvent(eventKey: EventKey): Promise<Event | undefined> {
		const prefix: string = this.methodName(this.readEvent);
		console.info(prefix, { key: eventKey });

		const itemKey: ItemKey = DynamoDbEventsService.decodeEventKey(eventKey);

		const getItemInput: GetItemInput = {
			Key: itemKey as unknown as Key,
			TableName: this.config.tableName,
		};
		const getItemOutput: GetItemOutput = await this.dependencies.documentClient
			.get(getItemInput)
			.promise();

		const event = getItemOutput.Item?.event as Event | undefined;
		console.info(prefix, { result: event });
		return event;
	}

	private static decodeEventKey(eventKey: EventKey): ItemKey {
		const json: string = Buffer.from(eventKey, 'base64').toString('utf8');
		const itemKey = JSON.parse(json) as ItemKey;
		return itemKey;
	}

	private static encodeEventKey(itemKey: ItemKey): EventKey {
		const json: string = JSON.stringify({
			primaryKey: itemKey.primaryKey,
			sortKey: itemKey.sortKey,
		});
		const eventKey: EventKey = Buffer.from(json).toString('base64');
		return eventKey;
	}
}

interface EventItem extends ItemKey {
	event: Event;
}

function toEventItem(event: Event): EventItem {
	return {
		event,
		primaryKey: generateKey([KeyLabel.eventPartition, '0000']),
		sortKey: generateKey(
			[KeyLabel.timestamp, event.timestamp],
			[KeyLabel.eventId, event.eventId],
		),
	};
}
