import * as yup from 'yup';
import { Event, EventKey } from '../events/events';
import { EventToUserStateConverter, UserActivity, UserState } from './user-states';

export interface GoveeIftttOnOrOffEvent {
	createdAt: string;
	deviceName: string;
	message: string;
}

export abstract class GoveeIftttOnOrOffEvent {
	public static convertToUserState(eventKey: EventKey, event: Event): UserState | undefined {
		let userState: UserState | undefined;

		if (GoveeIftttOnOrOffEvent.schema.isValidSync(event.data)) {
			const goveeIftttEvent: GoveeIftttOnOrOffEvent = event.data;

			const onOrOff: string | undefined = GoveeIftttOnOrOffEvent.messageRegex.exec(
				goveeIftttEvent.message,
			)?.groups?.onOrOff;
			if (onOrOff) {
				userState = {
					activity: onOrOff === 'on' ? UserActivity.idle : UserActivity.absent,
					eventKey,
					source: {
						deviceId: goveeIftttEvent.deviceName,
						serviceName: 'Govee',
					},
					timestamp: event.timestamp,
					userId: 'Robert',
					version: 1,
				};
			}
		}

		return userState;
	}

	private static get messageRegex(): RegExp {
		return (GoveeIftttOnOrOffEvent._messageRegex ??=
			/"(?<deviceName>[^"]+)" turned (?<onOrOff>on|off)!/);
	}

	private static get schema(): yup.SchemaOf<GoveeIftttOnOrOffEvent> {
		return (GoveeIftttOnOrOffEvent._schema ??= yup.object({
			createdAt: yup.string().required(),
			deviceName: yup.string().required(),
			message: yup.string().matches(this.messageRegex).required(),
		}));
	}

	private static _messageRegex: RegExp | undefined;
	private static _schema: yup.SchemaOf<GoveeIftttOnOrOffEvent> | undefined;
}

const typeCheck: EventToUserStateConverter = GoveeIftttOnOrOffEvent.convertToUserState;
void typeCheck;
