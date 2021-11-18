import { Event } from './events';
import { EventsService } from './events-service';

type Config = object;
type Dependencies = object;

export class MockEventsService extends EventsService<string, Config, Dependencies> {
	public constructor() {
		super({}, {});
	}

	public async createEvent(event: Event): Promise<string> {
		const prefix: string = this.methodName(this.createEvent);
		console.info(prefix, { event });

		const eventKey: string = event.eventId;
		this.events.set(eventKey, event);

		console.info(prefix, { result: eventKey });
		return eventKey;
	}

	public async readEvent(eventKey: string): Promise<Event | undefined> {
		return this.events.get(eventKey);
	}

	private readonly events = new Map<string, Event>();
}
