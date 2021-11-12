import { Event, EventKey } from '../events/events';

export const UserActivity = {
	idle: 'idle',
	busy: 'busy',
	meeting: 'meeting',
	presenting: 'presenting',
	absent: 'absent',
} as const;

export type UserActivity = typeof UserActivity[keyof typeof UserActivity];

export interface UserState {
	activity: UserActivity;
	eventKey: EventKey;
	source: {
		deviceId: string;
		serviceName: string;
	};
	timestamp: string;
	userId: string;
	version: 1;
}

export abstract class UserState {
	/**
	 * Sort `UserState`s in descending order by activity level primarily, and timestamp secondarily
	 * as a tie-breaker. In other words, the state having the highest and most recent activity level
	 * will be at the front of the new array.
	 */
	public static sortByActivityAndTimestamp(states: readonly Readonly<UserState>[]): UserState[] {
		return states
			.slice()
			.sort(
				(a: Readonly<UserState>, b: Readonly<UserState>): number =>
					-(
						UserState.activityLevels[a.activity] -
							UserState.activityLevels[b.activity] ||
						a.timestamp.localeCompare(b.timestamp)
					),
			);
	}

	private static get activityLevels(): Readonly<Record<UserActivity, number>> {
		return (UserState._activityLevels ??= Object.freeze({
			unknown: 0,
			idle: 1,
			busy: 2,
			meeting: 3,
			presenting: 4,
			absent: 5,
		}));
	}

	private static _activityLevels: Readonly<Record<UserActivity, number>> | undefined;
}

export type UserStateKey = string;

export interface UserStateAndKey {
	userState: UserState;
	userStateKey: UserStateKey;
}

export type EventToUserStateConverter = (eventKey: EventKey, event: Event) => UserState | undefined;
