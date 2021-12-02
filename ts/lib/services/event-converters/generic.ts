import * as yup from 'yup';
import { EventAndKey } from '../events/events';
import { locationIdGlobal } from '../user-locations/user-locations';
import { UserActivity, UserState } from '../user-states/user-states';

export interface GenericEvent {
	activity: UserActivity;
	locationId?: string;
	source?: {
		deviceId: string;
		serviceName: string;
	};
	userId: string;
}

export abstract class GenericEvent {
	public static get schema(): yup.SchemaOf<GenericEvent> {
		return (GenericEvent._schema ??= yup.object({
			activity: yup.mixed<UserActivity>().oneOf(Object.values(UserActivity)).required(),
			locationId: yup.string().optional(),
			source: yup
				.object({
					deviceId: yup.string().required(),
					serviceName: yup.string().required(),
				})
				.default(undefined)
				.optional(),
			userId: yup.string().required(),
		})).required();
	}

	public static convertToUserState<TEventKey = unknown>(
		eventAndKey: EventAndKey<TEventKey>,
	): UserState<TEventKey> | undefined {
		let userState: UserState<TEventKey> | undefined;

		if (GenericEvent.schema.isValidSync(eventAndKey.event.data)) {
			const genericEvent: GenericEvent = eventAndKey.event.data;
			userState = {
				activity: genericEvent.activity,
				eventKey: eventAndKey.eventKey,
				locationId: genericEvent.locationId || locationIdGlobal,
				source: genericEvent.source ?? {
					deviceId: 'Generic',
					serviceName: 'Generic',
				},
				timestamp: eventAndKey.event.timestamp,
				userId: genericEvent.userId,
				version: 1,
			};
		}

		return userState;
	}

	private static _schema: yup.SchemaOf<GenericEvent> | undefined;
}
