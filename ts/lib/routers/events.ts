import express from 'express';
import asyncHandler from 'express-async-handler';
import { validate } from 'express-yup';
import isEmpty from 'lodash/isEmpty';
import { v4 as uuid } from 'uuid';
import * as yup from 'yup';
import { EventToUserStateConverter } from '../services/event-converters/event-converters';
import { Event, EventAndKey } from '../services/events/events';
import { EventsService } from '../services/events/events-service';
import { OnAirLightService, OnAirLightState } from '../services/on-air-lights/on-air-light-service';
import { locationIdGlobal } from '../services/user-locations/user-locations';
import { UserActivity, UserState, UserStateAndKey } from '../services/user-states/user-states';
import { UserStatesService } from '../services/user-states/user-states-service';

export function createEventsRouter<TEventKey>({
	eventsService,
	eventToUserStateConverters,
	onAirLightService,
	userStatesService,
}: {
	eventsService: EventsService<TEventKey>;
	eventToUserStateConverters: readonly EventToUserStateConverter<TEventKey>[];
	onAirLightService: OnAirLightService;
	userStatesService: UserStatesService;
}): express.IRouter {
	const router: express.Router = express.Router();

	router.post(
		'/events',
		validate(
			yup
				.mixed()
				.test(
					'request',
					'request must include a nonempty query or nonempty body',
					(req: express.Request): boolean => !(isEmpty(req.body) && isEmpty(req.query)),
				),
		),
		asyncHandler(async (req, res, _next) => {
			// It's easy to imagine a simple client that invokes this API by specifying only the
			// path (URL + query), so the query parameters are supported as an event data source.
			// Merge the query and body into a single object to support either or both.
			const data: object = {
				...req.body,
				...req.query,
			};

			// Save the event.
			const event: Event = {
				data,
				eventId: uuid(),
				timestamp: new Date().toISOString(),
			};
			const eventKey: TEventKey = await eventsService.createEvent(event);
			const eventAndKey: EventAndKey<TEventKey> = {
				event,
				eventKey,
			};

			// Convert the event to a user state.
			let userStateAndKey: UserStateAndKey | undefined;
			for (const convert of eventToUserStateConverters) {
				const userState: UserState | undefined = convert(eventAndKey);
				if (userState) {
					userStateAndKey = {
						userState,
						userStateKey: await userStatesService.createUserState(userState),
					};
					break;
				}
			}

			if (userStateAndKey) {
				// Read all user states and determine the user's activity.
				const userStates: UserState[] = await userStatesService.readUserStates(
					userStateAndKey.userState.userId,
					userStateAndKey.userState.locationId,
				);
				const locations: Map<
					string,
					Set<UserActivity>
				> = UserState.aggregateActivitiesByLocation(userStates);

				// Update the on-air light accordingly.
				const onAirLightState: OnAirLightState = OnAirLightState.fromUserActivities(
					locations.get(locationIdGlobal) ?? new Set<UserActivity>(),
				);
				await onAirLightService.setState(onAirLightState);
			}

			res.status(userStateAndKey ? 201 : 202)
				.location(`/events/${await eventsService.eventKeyToUrlPart(eventKey)}`)
				.json(event);
		}),
	);

	router.get(
		'/events/:eventKey',
		asyncHandler(async (req, res, _next) => {
			const eventKey: TEventKey = await eventsService.eventKeyFromUrlPart(
				req.params.eventKey ?? '',
			);
			const event: Event | undefined = await eventsService.readEvent(eventKey);
			res.status(event ? 200 : 404).json(event);
		}),
	);

	return router;
}
