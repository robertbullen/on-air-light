import * as yup from 'yup';
import { EventAndKey } from '../events/events';
import { locationIdGlobal } from '../user-locations/user-locations';
import { UserActivity, UserState } from '../user-states/user-states';

export interface GoveeIftttOnOrOffEvent {
	createdAt: string;
	deviceName: string;
	message: string;
	userId: string;
}

export abstract class GoveeIftttOnOrOffEvent {
	public static get schema(): yup.SchemaOf<GoveeIftttOnOrOffEvent> {
		return (GoveeIftttOnOrOffEvent._schema ??= yup.object({
			createdAt: yup.string().required(),
			deviceName: yup.string().required(),
			message: yup.string().matches(this.messageRegex).required(),
			userId: yup.string().required(),
		})).required();
	}

	public static convertToUserState<TEventKey = unknown>(
		eventAndKey: EventAndKey<TEventKey>,
	): UserState<TEventKey> | undefined {
		let userState: UserState<TEventKey> | undefined;

		if (GoveeIftttOnOrOffEvent.schema.isValidSync(eventAndKey.event.data)) {
			const goveeIftttEvent: GoveeIftttOnOrOffEvent = eventAndKey.event.data;

			const onOrOff: string | undefined = GoveeIftttOnOrOffEvent.messageRegex.exec(
				goveeIftttEvent.message,
			)?.groups?.onOrOff;
			if (!onOrOff) {
				throw new TypeError();
			}

			userState = {
				activities: onOrOff === 'on' ? [UserActivity.detected] : [],
				eventKey: eventAndKey.eventKey,
				locationId: locationIdGlobal,
				source: {
					deviceId: goveeIftttEvent.deviceName,
					serviceName: 'Govee',
				},
				timestamp: eventAndKey.event.timestamp,
				userId: goveeIftttEvent.userId,
				version: 1,
			};
		}

		return userState;
	}

	private static get messageRegex(): RegExp {
		return (GoveeIftttOnOrOffEvent._messageRegex ??=
			/"(?<deviceName>[^"]+)" turned (?<onOrOff>on|off)!/);
	}

	private static _messageRegex: RegExp | undefined;
	private static _schema: yup.SchemaOf<GoveeIftttOnOrOffEvent> | undefined;
}
