import cors from 'cors';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { validate } from 'express-yup';
import * as yup from 'yup';
import {
	Color,
	OnAirLightService,
	OnAirLightState,
	Pattern,
} from './services/on-air-light/on-air-light-service';
import { SecretsService } from './services/secrets/secrets-service';
import { Service } from './services/service';
import * as zoom from './zoom';

export async function createApp({
	healthCheckServices,
	onAirLightService,
	secretsService,
}: {
	healthCheckServices: readonly Service[];
	onAirLightService: OnAirLightService;
	secretsService: SecretsService;
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

	interface StudioUserPresence {
		detectorDevice: string;
		detectorService: string;
		userPresent: boolean;
	}

	const StudioUserPresence = {
		schema(): yup.SchemaOf<StudioUserPresence> {
			return yup.object({
				detectorDevice: yup.string().required(),
				detectorService: yup.string().required(),
				userPresent: yup.boolean().required(),
			});
		},
	};

	app.get(
		'/health',
		asyncHandler(async (_req, res, _next) => {
			const result = await Service.checkHealthOfAll(healthCheckServices);
			res.status(200).json(result);
		}),
	);

	app.post(
		'/users/:userId/studios/:studioId',
		validate(
			yup
				.object({
					body: StudioUserPresence.schema().required(),
					headers: yup
						.object({
							'ifttt-client-id': yup
								.string()
								.oneOf([(await secretsService.getSecrets()).iftttClientId]),
						})
						.required(),
				})
				.required(),
		),
		asyncHandler(async (req, res, _next) => {
			const userId = req.params.userId as string;
			const studioId = req.params.studioId as string;
			const body = req.body as StudioUserPresence;
			console.info({ studioId, userId, body });

			res.status(204).send();
		}),
	);

	app.post(
		'/users/:userId/zoom',
		validate(
			yup
				.object({
					body: zoom.UserPresenceStatusUpdated.schema().required(),
					headers: yup
						.object({
							authorization: yup.string().required(),
							clientid: yup
								.string()
								.oneOf([(await secretsService.getSecrets()).zoomClientId])
								.required(),
						})
						.required(),
				})
				.required(),
		),
		asyncHandler(async (req, res, _next) => {
			const userId = req.params.userId as string;
			const body = req.body as zoom.UserPresenceStatusUpdated;
			console.info({ userId, body });

			const state: Partial<OnAirLightState> = {};
			switch (body.payload.object.presence_status) {
				case zoom.UserPresenceStatus.available:
					state.color = Color.lime;
					state.pattern = Pattern.solid;
					break;

				case zoom.UserPresenceStatus.doNotDisturb:
				case zoom.UserPresenceStatus.inCalendarEvent:
					state.color = Color.yellow;
					state.pattern = Pattern.solid;
					break;

				case zoom.UserPresenceStatus.inMeeting:
				case zoom.UserPresenceStatus.onPhoneCall:
					state.color = Color.red;
					state.pattern = Pattern.solid;
					break;

				case zoom.UserPresenceStatus.presenting:
					state.color = Color.red;
					state.pattern = Pattern.flash;
					break;

				default:
					state.color = Color.black;
					state.pattern = Pattern.solid;
					break;
			}
			await onAirLightService.setState(state);

			res.status(204).send();
		}),
	);

	return app;
}
