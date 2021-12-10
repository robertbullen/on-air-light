import { UserActivity } from '../user-states/user-states';
import { GenericEvent } from './generic';

describe(GenericEvent, () => {
	describe('schema', () => {
		// There are some casts in './generic.ts' to workaround yup's `T[] | undefined` issue
		// [#1367](https://github.com/jquense/yup/issues/1389). These tests ensure that the correct
		// behavior is in place even though complete type safety is not.
		it.each([
			{
				description: 'rejects undefined `activities`',
				event: {
					activities: undefined,
					userId: 'userId',
				},
				valid: false,
			},
			{
				description: 'accepts empty `activities`',
				event: {
					activities: [],
					userId: 'userId',
				},
				valid: true,
			},
			{
				description: 'accepts nonempty `activities` holding valid values',
				event: {
					activities: [UserActivity.detected, UserActivity.presenting],
					userId: 'userId',
				},
				valid: true,
			},
			{
				description: 'rejects nonempty `activities` holding invalid values',
				event: {
					activities: ['foo', 'bar'],
					userId: 'userId',
				},
				valid: false,
			},
		])('$description', ({ event, valid }) => {
			if (valid) {
				expect(GenericEvent.schema.validateSync(event)).toMatchObject(event);
			} else {
				expect(() => GenericEvent.schema.validateSync(event)).toThrow();
			}
		});
	});
});
