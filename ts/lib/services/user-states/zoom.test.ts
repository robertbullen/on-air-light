import { Event } from '../events/events';
import { UserState } from './user-states';
import { ZoomUserPresenceStatusUpdatedEvent } from './zoom';

describe(ZoomUserPresenceStatusUpdatedEvent, () => {
	describe(ZoomUserPresenceStatusUpdatedEvent.convertToUserState, () => {
		it('converts a Zoom event to a valid `UserState`', () => {
			const zoomEvent: ZoomUserPresenceStatusUpdatedEvent = {
				event: 'user.presence_status_updated',
				payload: {
					account_id: 'j-ACBdefGHIjklMNOpqrST',
					object: {
						id: '0123456-abcdefghijklmn',
						presence_status: 'Do_Not_Disturb',
						date_time: '2021-11-12T21:39:02Z',
						email: 'user@example.com',
					},
				},
				event_ts: 1636753142836,
			};

			const eventKey: string = 'b8046f7c-2129-42e2-a1e6-05245184f06c';
			const event: Event = {
				data: zoomEvent,
				eventId: eventKey,
				timestamp: '2021-11-12T21:39:02Z',
			};

			const userState: UserState | undefined =
				ZoomUserPresenceStatusUpdatedEvent.convertToUserState(eventKey, event);
			expect(userState).toMatchInlineSnapshot(`
Object {
  "activity": "busy",
  "eventKey": "b8046f7c-2129-42e2-a1e6-05245184f06c",
  "source": Object {
    "deviceId": "Zoom",
    "serviceName": "Zoom",
  },
  "timestamp": "2021-11-12T21:39:02Z",
  "userId": "Robert",
  "version": 1,
}
`);
		});
	});
});
