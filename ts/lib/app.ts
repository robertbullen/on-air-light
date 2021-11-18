import cors from 'cors';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { validate } from 'express-yup';
import isEmpty from 'lodash/isEmpty';
import { v4 as uuid } from 'uuid';
import * as yup from 'yup';
import { Event, EventKey } from './services/events/events';
import { EventsService } from './services/events/events-service';
import { OnAirLightService, OnAirLightState } from './services/on-air-lights/on-air-light-service';
import { Service } from './services/service';
import {
	EventToUserStateConverter,
	UserActivity,
	UserState,
	UserStateAndKey,
} from './services/user-states/user-states';
import { UserStatesService } from './services/user-states/user-states-service';

export async function createApp({
	eventsService,
	eventToUserStateConverters,
	healthCheckServices,
	onAirLightService,
	userStatesService,
}: {
	eventsService: EventsService;
	eventToUserStateConverters: readonly EventToUserStateConverter[];
	healthCheckServices: readonly Service[];
	onAirLightService: OnAirLightService;
	userStatesService: UserStatesService;
}): Promise<express.Application> {
	const app = express();
	app.use(cors());
	app.use(express.json());

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
			// Save the event.
			const event: Event = {
				data: req.body,
				eventId: uuid(),
				timestamp: new Date().toISOString(),
			};
			const eventKey: EventKey = await eventsService.createEvent(event);

			// Convert the event to a user state.
			let userStateAndKey: UserStateAndKey | undefined;
			for (const convert of eventToUserStateConverters) {
				const userState: UserState | undefined = convert(eventKey, event);
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
				);
				const sortedUserStates: UserState[] =
					UserState.sortByActivityAndTimestamp(userStates);
				const activity: UserActivity | undefined = sortedUserStates[0]?.activity;

				// Update the on-air light accordingly.
				const onAirLightState: OnAirLightState = OnAirLightState.fromUserActivity(activity);
				await onAirLightService.setState(onAirLightState);
			}

			res.status(201).location(`/events/${eventKey}`).json(event);
		}),
	);

	app.get(
		'/events/:eventKey',
		asyncHandler(async (req, res, _next) => {
			const eventKey: EventKey = req.params.eventKey ?? '';
			const event: Event | undefined = await eventsService.readEvent(eventKey);
			res.status(event ? 200 : 404).json(event);
		}),
	);

	return app;
}
