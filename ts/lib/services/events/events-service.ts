import { HealthCheckResult, Service } from '../service';
import { Event, EventAndKey, EventKey } from './events';

export abstract class EventsService<
	TConfig extends object = object,
	TDependencies extends object = object,
> extends Service<TConfig, TDependencies, EventAndKey> {
	public static createHealthCheckEvent(): Event {
		return {
			data: {},
			eventId: 'health-check',
			timestamp: new Date(0).toISOString(),
		};
	}

	public checkHealth(): Promise<HealthCheckResult<EventAndKey>> {
		return this.doCheckHealth(async () => {
			const event: Event = EventsService.createHealthCheckEvent();
			const eventKey: EventKey = await this.createEvent(event);
			return {
				event,
				eventKey,
			};
		});
	}

	public abstract createEvent(event: Event): Promise<EventKey>;

	public abstract readEvent(eventKey: EventKey): Promise<Event | undefined>;
}
