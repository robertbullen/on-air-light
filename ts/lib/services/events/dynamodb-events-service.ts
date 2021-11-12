import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { generateKey, ItemKey, KeyLabel } from '../../dynamodb';
import { Event, EventKey } from './events';
import { EventsService } from './events-service';

interface Config {
	tableName: string;
}

interface Dependencies {
	documentClient: DocumentClient;
}

export class DynamoDbEventsService extends EventsService<Config, Dependencies> {
	public constructor(config: Readonly<Config>, dependencies: Readonly<Dependencies>) {
		super(config, dependencies);
	}

	public async createEvent(event: Event): Promise<EventKey> {
		const prefix: string = this.methodName(this.createEvent);
		console.info(prefix, { event });

		const eventItem: EventItem = EventItem.fromEvent(event);
		const putItemInput: DocumentClient.PutItemInput = {
			Item: eventItem,
			TableName: this.config.tableName,
		};
		await this.dependencies.documentClient.put(putItemInput).promise();
		const eventKey: EventKey = ItemKey.encode(eventItem);

		console.info(prefix, { result: eventKey });
		return eventKey;
	}

	public async readEvent(eventKey: EventKey): Promise<Event | undefined> {
		const prefix: string = this.methodName(this.readEvent);
		console.info(prefix, { key: eventKey });

		const itemKey: ItemKey = ItemKey.decode(eventKey);
		const getItemInput: DocumentClient.GetItemInput = {
			Key: itemKey,
			TableName: this.config.tableName,
		};
		const getItemOutput: DocumentClient.GetItemOutput = await this.dependencies.documentClient
			.get(getItemInput)
			.promise();
		const event = getItemOutput.Item?.event as Event | undefined;

		console.info(prefix, { result: event });
		return event;
	}
}

interface EventItem extends ItemKey {
	event: Event;
}

abstract class EventItem {
	public static fromEvent(event: Event): EventItem {
		return {
			primaryKey: generateKey([KeyLabel.eventPartition, '0000']),
			sortKey: generateKey(
				[KeyLabel.timestamp, event.timestamp],
				[KeyLabel.eventId, event.eventId],
			),
			event,
		};
	}
}
