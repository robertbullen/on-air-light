import * as yup from 'yup';
import { EventAndKey } from '../events/events';
import { locationIdWildcard } from '../user-locations/user-locations';
import { UserActivity, UserState } from '../user-states/user-states';

/**
 * https://marketplace.zoom.us/docs/api-reference/webhook-reference/user-events/presence-status-updated
 */
export const ZoomUserPresenceStatus = {
	available: 'Available',
	away: 'Away',
	doNotDisturb: 'Do_Not_Disturb',
	inCalendarEvent: 'In_Calendar_Event',
	inMeeting: 'In_Meeting',
	onPhoneCall: 'On_Phone_Call',
	presenting: 'Presenting',
} as const;

type ZoomUserPresenceStatus = typeof ZoomUserPresenceStatus[keyof typeof ZoomUserPresenceStatus];

function statusToUserActivity(status: ZoomUserPresenceStatus): UserActivity {
	switch (status) {
		case ZoomUserPresenceStatus.available:
		case ZoomUserPresenceStatus.away:
			return UserActivity.idle;

		case ZoomUserPresenceStatus.doNotDisturb:
		case ZoomUserPresenceStatus.inCalendarEvent:
			return UserActivity.busy;

		case ZoomUserPresenceStatus.inMeeting:
		case ZoomUserPresenceStatus.onPhoneCall:
			return UserActivity.meeting;

		case ZoomUserPresenceStatus.presenting:
			return UserActivity.presenting;
	}
}

export interface ZoomUserPresenceStatusUpdatedEvent {
	event: 'user.presence_status_updated';
	event_ts: number;
	payload: {
		account_id: string;
		object: {
			date_time: string;
			email: string;
			id: string;
			presence_status: ZoomUserPresenceStatus;
		};
	};
}

export abstract class ZoomUserPresenceStatusUpdatedEvent {
	public static get schema(): yup.SchemaOf<ZoomUserPresenceStatusUpdatedEvent> {
		return (ZoomUserPresenceStatusUpdatedEvent._schema ??= yup.object({
			event: yup
				.mixed<ZoomUserPresenceStatusUpdatedEvent['event']>()
				.oneOf(['user.presence_status_updated'])
				.required(),
			event_ts: yup.number().required(),
			payload: yup
				.object({
					account_id: yup.string().required(),
					object: yup
						.object({
							date_time: yup.string().required(),
							email: yup.string().email().required(),
							id: yup.string().required(),
							presence_status: yup.mixed<ZoomUserPresenceStatus>().required(),
						})
						.required(),
				})
				.required(),
		})).required();
	}

	public static convertToUserState<TEventKey = unknown>(
		eventAndKey: EventAndKey<TEventKey>,
	): UserState<TEventKey> | undefined {
		let userState: UserState<TEventKey> | undefined;

		if (ZoomUserPresenceStatusUpdatedEvent.schema.isValidSync(eventAndKey.event.data)) {
			// TODO: Why is the yup schema incompatible without this cast?
			const zoomEvent = eventAndKey.event.data as ZoomUserPresenceStatusUpdatedEvent;

			userState = {
				activity: statusToUserActivity(zoomEvent.payload.object.presence_status),
				eventKey: eventAndKey.eventKey,
				locationId: locationIdWildcard,
				source: {
					deviceId: 'Zoom',
					serviceName: 'Zoom',
				},
				timestamp: eventAndKey.event.timestamp,
				userId: 'Robert',
				version: 1,
			};
		}

		return userState;
	}

	private static _schema: yup.SchemaOf<ZoomUserPresenceStatusUpdatedEvent> | undefined;
}
