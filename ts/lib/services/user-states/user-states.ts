/**
 * An enumeration describing what a user is doing. They are used throughout this application as if
 * they were pseudo bit fields.
 *
 * These fields are named as single words that complete the sentence, "The user is <blank>."
 */
export const UserActivity = {
	detected: 'detected',
	busy: 'busy',
	meeting: 'meeting',
	presenting: 'presenting',
} as const;

export type UserActivity = typeof UserActivity[keyof typeof UserActivity];

/**
 * An object describing the current state of the user.
 */
export interface UserState<TEventKey = unknown> {
	/**
	 * The list of activities
	 */
	activities: UserActivity[];

	/**
	 * The key to the event object from which this state object was derived.
	 */
	eventKey: TEventKey;

	/**
	 * The location to which this state object pertains.
	 */
	locationId: string;

	/**
	 * The source ultimately responsible for reporting this state.
	 */
	source: {
		deviceId: string;
		serviceName: string;
	};

	/**
	 * The point in time at which this state was created.
	 */
	timestamp: string;

	/**
	 * The user to which this state object pertains.
	 */
	userId: string;

	/**
	 * A version number that dictates the shape of this object. Currently there is only one.
	 */
	version: 1;
}

export abstract class UserState {
	public static aggregateActivitiesByLocation(
		states: readonly Readonly<UserState>[],
	): Map<string, Set<UserActivity>> {
		const locations = new Map<string, Set<UserActivity>>();
		for (const state of states) {
			let activities = locations.get(state.locationId);
			if (!activities) {
				activities = new Set<UserActivity>();
				locations.set(state.locationId, activities);
			}
			for (const activity of state.activities) {
				activities.add(activity);
			}
		}
		return locations;
	}
}

export interface UserStateAndKey<TUserStateKey = unknown> {
	userState: UserState;
	userStateKey: TUserStateKey;
}
