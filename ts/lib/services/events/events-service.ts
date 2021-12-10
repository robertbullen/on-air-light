import { HealthCheckResult, Service } from '../service';
import { Event, EventAndKey } from './events';

export abstract class EventsService<
	TEventKey,
	TConfig extends object = object,
	TDependencies extends object = object,
> extends Service<TConfig, TDependencies, EventAndKey<TEventKey>> {
	public static createHealthCheckEvent(): Event {
		return {
			data: {},
			eventId: 'health-check',
			timestamp: new Date(0).toISOString(),
		};
	}

	public checkHealth(): Promise<HealthCheckResult<EventAndKey<TEventKey>>> {
		return this.doCheckHealth(async () => {
			const event: Event = EventsService.createHealthCheckEvent();
			const eventKey: TEventKey = await this.createEvent(event);
			return {
				event,
				eventKey,
			};
		});
	}

	public abstract createEvent(event: Event): Promise<TEventKey>;

	public abstract readEvent(eventKey: TEventKey): Promise<Event | undefined>;

	public abstract eventKeyFromUrlPart(urlPart: string): Promise<TEventKey>;
	public abstract eventKeyToUrlPart(eventKey: TEventKey): Promise<string>;
}
