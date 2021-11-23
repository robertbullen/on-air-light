import { CryptoService } from './services/crypto/crypto-service';

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

	public static async encode(
		itemKey: ItemKey,
		cryptoService: CryptoService,
		encoding: BufferEncoding,
	): Promise<string> {
		const json: string = JSON.stringify(ItemKey.from(itemKey));
		const encryptedJson: Buffer = await cryptoService.encrypt(Buffer.from(json));
		const value: string = encryptedJson.toString(encoding);
		return value;
	}

	public static async decode(
		value: string,
		cryptoService: CryptoService,
		encoding: BufferEncoding,
	): Promise<ItemKey> {
		const decryptedJson: Buffer = await cryptoService.decrypt(Buffer.from(value, encoding));
		const json: string = decryptedJson.toString('utf8');
		const itemKey = JSON.parse(json) as ItemKey;
		return itemKey;
	}
}

export function keyName<T>(fieldName: keyof T): keyof T {
	return fieldName;
}
