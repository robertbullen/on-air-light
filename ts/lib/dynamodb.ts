export const KeyLabel = {
	eventId: 'EVT',
	eventPartition: 'EPT',
	lightId: 'LIT',
	locationId: 'LOC',
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
	/**
	 * Creates a new object containing just the `primaryKey` and `sortKey` fields of the given
	 * `itemKey`, which may have other fields on it as well.
	 */
	public static from(itemKey: ItemKey): ItemKey {
		return {
			primaryKey: itemKey.primaryKey,
			sortKey: itemKey.sortKey,
		};
	}

	public static encode(itemKey: ItemKey, encoding: BufferEncoding = 'base64url'): string {
		const json: string = JSON.stringify(ItemKey.from(itemKey));
		const jsonBuffer: Buffer = Buffer.from(json);
		const value: string = jsonBuffer.toString(encoding);
		return value;
	}

	public static decode(value: string, encoding: BufferEncoding = 'base64url'): ItemKey {
		const jsonBuffer: Buffer = Buffer.from(value, encoding);
		const json: string = jsonBuffer.toString('utf8');
		const itemKey = JSON.parse(json) as ItemKey;
		return itemKey;
	}
}

export function keyName<T>(fieldName: keyof T): keyof T {
	return fieldName;
}
