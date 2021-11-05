import { HealthCheckResult, Service } from '../service';

export interface Event {
	data: unknown;
	eventId: string;
	timestamp: string;
}

export type EventKey = string;

export interface HealthCheckData {
	event: Event;
	eventKey: EventKey;
}

export abstract class EventsService<
	TConfig extends object = object,
	TDependencies extends object = object,
> extends Service<TConfig, TDependencies, HealthCheckData> {
	public checkHealth(): Promise<HealthCheckResult<HealthCheckData>> {
		return this.doCheckHealth(async () => {
			const event: Event = {
				data: {},
				eventId: 'health-check',
				timestamp: new Date(0).toISOString(),
			};
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
