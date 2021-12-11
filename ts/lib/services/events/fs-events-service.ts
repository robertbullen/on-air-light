import * as fs from 'fs';
import * as path from 'path';
import { Event } from './events';
import { EventsService } from './events-service';

interface Config {
	baseDirPath: string;
}

type Dependencies = object;

type EventKey = string;

export class FsEventsService extends EventsService<EventKey, Config, Dependencies> {
	public constructor(config: Readonly<Config>) {
		super(config, {});
	}

	public async createEvent(event: Event): Promise<string> {
		const prefix: string = this.methodName(this.createEvent);
		console.info(prefix, { event });

		const eventDirPath: string = path.join(this.config.baseDirPath, 'events');
		const eventFileName = `${event.timestamp}_${event.eventId}.json`;
		const eventFilePath: string = path.join(eventDirPath, eventFileName);
		const eventRelFilePath: string = path.relative(this.config.baseDirPath, eventFilePath);

		await fs.promises.mkdir(eventDirPath, { recursive: true });

		const eventJson: string = JSON.stringify(event, undefined, '\t');
		await fs.promises.writeFile(eventFilePath, eventJson);

		const eventKey: EventKey = eventRelFilePath;
		console.info(prefix, { result: eventKey });
		return eventKey;
	}

	public async readEvent(eventKey: EventKey): Promise<Event | undefined> {
		const prefix: string = this.methodName(this.readEvent);
		console.info(prefix, { eventKey });

		const eventRelFilePath: string = eventKey;
		const eventFilePath: string = path.resolve(this.config.baseDirPath, eventRelFilePath);

		let eventJson: string;
		try {
			eventJson = await fs.promises.readFile(eventFilePath, 'utf8');
		} catch (error) {
			if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
				return undefined;
			}
			throw error;
		}

		const event = JSON.parse(eventJson) as Event;
		console.info(prefix, { result: event });
		return event;
	}

	public async eventKeyFromUrlPart(urlPart: string): Promise<string> {
		return Buffer.from(urlPart, 'base64url').toString('utf8');
	}

	public async eventKeyToUrlPart(eventKey: EventKey): Promise<string> {
		return Buffer.from(eventKey, 'utf8').toString('base64url');
	}
}
