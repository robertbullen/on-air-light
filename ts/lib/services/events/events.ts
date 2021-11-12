export interface Event {
	data: unknown;
	eventId: string;
	timestamp: string;
}

export type EventKey = string;

export interface EventAndKey {
	event: Event;
	eventKey: EventKey;
}
