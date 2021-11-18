import { EventAndKey } from '../events/events';
import { UserState } from '../user-states/user-states';

export type EventToUserStateConverter<TEventKey = unknown> = (
	eventAndKey: EventAndKey<TEventKey>,
) => UserState<TEventKey> | undefined;
