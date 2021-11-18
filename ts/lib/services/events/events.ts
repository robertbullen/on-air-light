export interface Event {
	data: unknown;
	eventId: string;
	timestamp: string;
}

export interface EventAndKey<TEventKey = unknown> {
	event: Event;
	eventKey: TEventKey;
}
