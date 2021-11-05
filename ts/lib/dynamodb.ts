export interface ItemKey {
	primaryKey: string;
	sortKey: string;
}

export const KeyLabel = {
	eventId: 'EID',
	eventPartition: 'EVT',
	source: 'SRC',
	timestamp: 'TST',
	user: 'USR',
} as const;

export type KeyLabel = typeof KeyLabel[keyof typeof KeyLabel];

export function generateKey(...tuples: readonly [KeyLabel, unknown][]): string {
	return tuples.map((tuple) => tuple.join(':')).join('#');
}
