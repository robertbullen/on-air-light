import * as yup from 'yup';

/**
 * https://marketplace.zoom.us/docs/api-reference/webhook-reference/user-events/presence-status-updated
 */
export const UserPresenceStatus = {
	available: 'Available',
	away: 'Away',
	doNotDisturb: 'Do_Not_Disturb',
	inCalendarEvent: 'In_Calendar_Event',
	inMeeting: 'In_Meeting',
	onPhoneCall: 'On_Phone_Call',
	presenting: 'Presenting',
} as const;

export type UserPresenceStatus = typeof UserPresenceStatus[keyof typeof UserPresenceStatus];

export interface UserPresenceStatusUpdated {
	event: 'user.presence_status_updated';
	event_ts: number;
	payload: {
		account_id: string;
		object: {
			date_time: string;
			email: string;
			id: string;
			presence_status: UserPresenceStatus;
		};
	};
}

export const UserPresenceStatusUpdated = {
	schema(): yup.SchemaOf<UserPresenceStatusUpdated> {
		return yup.object({
			event: yup
				.mixed<UserPresenceStatusUpdated['event']>()
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
							presence_status: yup.mixed<UserPresenceStatus>().required(),
						})
						.required(),
				})
				.required(),
		});
	},
};
