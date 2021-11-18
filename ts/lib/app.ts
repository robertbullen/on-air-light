import cors from 'cors';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { validate } from 'express-yup';
import isEmpty from 'lodash/isEmpty';
import { v4 as uuid } from 'uuid';
import * as yup from 'yup';
import { EventToUserStateConverter } from './services/event-converters/event-converters';
import { Event, EventAndKey } from './services/events/events';
import { EventsService } from './services/events/events-service';
import { OnAirLightService, OnAirLightState } from './services/on-air-lights/on-air-light-service';
import { Service } from './services/service';
import { UserActivity, UserState, UserStateAndKey } from './services/user-states/user-states';
import { UserStatesService } from './services/user-states/user-states-service';

export async function createApp<TEventKey>({
	eventKeyToUrlPart,
	eventKeyFromUrlPart,
	eventsService,
	eventToUserStateConverters,
	healthCheckServices,
	onAirLightService,
	userStatesService,
}: {
	eventKeyToUrlPart: (eventKey: TEventKey) => Promise<string>;
	eventKeyFromUrlPart: (urlPart: string) => Promise<TEventKey>;
	eventsService: EventsService<TEventKey>;
	eventToUserStateConverters: readonly EventToUserStateConverter<TEventKey>[];
	healthCheckServices: readonly Service[];
	onAirLightService: OnAirLightService;
	userStatesService: UserStatesService;
}): Promise<express.Application> {
	const app = express();
	app.use(cors());
	app.use(express.json());

	// Register a global error handler that understands the errors generated by express-yup and
	// converts them to 400-level status codes.
	const errorHandler: express.ErrorRequestHandler = (error, _req, res, next) => {
		if (error) {
			if (error instanceof Error) {
				console.error(error.toString());
			} else {
				console.error(error);
			}

			if (error instanceof yup.ValidationError) {
				res.status(400).json({ message: error.message });
				return;
			}
		}

		next(error);
	};
	app.use(errorHandler);

	app.get(
		'/health',
		asyncHandler(async (_req, res, _next) => {
			const result = await Service.checkHealthOfAll(healthCheckServices);
			res.status(200).json(result);
		}),
	);

	app.post(
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
				const sortedUserStates: UserState[] =
					UserState.sortByActivityAndTimestamp(userStates);
				const activity: UserActivity | undefined = sortedUserStates[0]?.activity;

				// Update the on-air light accordingly.
				const onAirLightState: OnAirLightState = OnAirLightState.fromUserActivity(activity);
				await onAirLightService.setState(onAirLightState);
			}

			res.status(userStateAndKey ? 201 : 202)
				.location(`/events/${await eventKeyToUrlPart(eventKey)}`)
				.json(event);
		}),
	);

	app.get(
		'/events/:eventKey',
		asyncHandler(async (req, res, _next) => {
			const eventKey: TEventKey = await eventKeyFromUrlPart(req.params.eventKey ?? '');
			const event: Event | undefined = await eventsService.readEvent(eventKey);
			res.status(event ? 200 : 404).json(event);
		}),
	);

	return app;
}
