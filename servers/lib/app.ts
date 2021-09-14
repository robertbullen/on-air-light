import cors from 'cors';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { validate } from 'express-yup';
// TODO: Figure out why this error occurs even with servers/lib/types/particle-api-js.d.ts:
// "TS7016: Could not find a declaration file for module 'particle-api-js'"
// @ts-ignore
import Particle from 'particle-api-js';
import * as yup from 'yup';
import * as zoom from './zoom';

export interface CreateAppParams {
	particleDeviceId: string;
	particlePassword: string;
	particleUsername: string;
	zoomClientId: string;
}

export function createApp({
	particleDeviceId,
	particlePassword,
	particleUsername,
	zoomClientId,
}: CreateAppParams): express.Application {
	const particle = new Particle();
	const particleLoginPromise = particle.login({
		password: particlePassword,
		username: particleUsername,
	});

	const app = express();
	app.use(cors());
	app.use(express.json());

	const headersSchema = yup
		.object({
			headers: yup
				.object({
					authorization: yup.string().required(),
					clientid: yup.string().oneOf([zoomClientId]).required(),
				})
				.required(),
		})
		.required();
	app.use(validate(headersSchema));

	const errorHandler: express.ErrorRequestHandler = (error, _req, res, next) => {
		if (error) {
			console.error({ error });
		}

		if (error instanceof yup.ValidationError) {
			res.status(400).json({ message: error.message });
			return;
		}

		next(error);
	};
	app.use(errorHandler);

	const userPresenceStatusBodySchema = yup
		.object({
			body: zoom.UserPresenceStatusUpdated.schema(),
		})
		.required();
	app.post(
		'/presence-status',
		validate(userPresenceStatusBodySchema),
		asyncHandler(async (req, res, _next) => {
			const event = req.body as zoom.UserPresenceStatusUpdated;
			console.info({ event });

			const particleLoginResponse = await particleLoginPromise;
			console.info({ particleLoginResponse });
			const token = particleLoginResponse.body.access_token;

			const red = 'ff0000';
			const yellow = 'ffff00';
			const green = '00ff00';
			const black = '000000';

			let color: string;
			let displayMode: string;

			switch (event.payload.object.presence_status) {
				case zoom.UserPresenceStatus.available:
					color = green;
					displayMode = 'solid';
					break;

				case zoom.UserPresenceStatus.doNotDisturb:
				case zoom.UserPresenceStatus.inCalendarEvent:
					color = yellow;
					displayMode = 'solid';
					break;

				case zoom.UserPresenceStatus.inMeeting:
				case zoom.UserPresenceStatus.onPhoneCall:
					color = red;
					displayMode = 'solid';
					break;

				case zoom.UserPresenceStatus.presenting:
					color = red;
					displayMode = 'flash';
					break;

				default:
					color = black;
					displayMode = 'solid';
					break;
			}

			const [setColorHexResult, setDisplayModeResult] = await Promise.all([
				particle.callFunction({
					argument: color,
					auth: token,
					deviceId: particleDeviceId,
					name: 'setColorHex',
				}),
				particle.callFunction({
					argument: displayMode,
					auth: token,
					deviceId: particleDeviceId,
					name: 'setDisplayMode',
				}),
			]);
			console.info({ setColorHexResult, setDisplayModeResult });

			res.status(204).send();
		}),
	);

	return app;
}
