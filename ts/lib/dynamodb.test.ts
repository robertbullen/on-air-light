import { ItemKey } from './dynamodb';
import { functionName } from './logging';

describe(ItemKey, () => {
	it(`${functionName(ItemKey.encode)} followed by ${functionName(
		ItemKey.decode,
	)} round trips`, () => {
		const itemKey: ItemKey = {
			primaryKey: '310fcece-5007-4ca4-ab14-38dea7a4dd42',
			sortKey: '2b6df627-e6ed-4482-b4e3-8eac5bb92623',
		};
		const encoded: string = ItemKey.encode(itemKey);
		const actualItemKey: ItemKey = ItemKey.decode(encoded);
		expect(actualItemKey).toEqual(itemKey);
	});
});
