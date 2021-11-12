export const KeyLabel = {
	eventId: 'EID',
	eventPartition: 'EVT',
	sourceServiceName: 'SVC',
	sourceDeviceId: 'DVC',
	timestamp: 'TST',
	userId: 'USR',
} as const;

export type KeyLabel = typeof KeyLabel[keyof typeof KeyLabel];

export function generateKey(...tuples: readonly Readonly<[KeyLabel, unknown]>[]): string {
	return tuples.map((tuple: Readonly<[KeyLabel, unknown]>): string => tuple.join(':')).join('#');
}

export interface ItemKey {
	primaryKey: string;
	sortKey: string;
}

export abstract class ItemKey {
	public static encode(itemKey: ItemKey): string {
		const json: string = JSON.stringify({
			primaryKey: itemKey.primaryKey,
			sortKey: itemKey.sortKey,
		});
		// TODO: Encrypt
		const value: string = Buffer.from(json).toString('base64');
		return value;
	}

	public static decode(value: string): ItemKey {
		// TODO: Decrypt
		const json: string = Buffer.from(value, 'base64').toString('utf8');
		const itemKey = JSON.parse(json) as ItemKey;
		return itemKey;
	}
}

export function keyName<T>(fieldName: keyof T): keyof T {
	return fieldName;
}
