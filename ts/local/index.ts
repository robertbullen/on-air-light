#!/usr/bin/env npx ts-node-script

import { paramCase } from 'change-case';
import * as express from 'express';
import * as http from 'http';
import localtunnel from 'localtunnel';
import { AddressInfo } from 'net';
// @ts-ignore
import Particle from 'particle-api-js';
import * as path from 'path';
import * as util from 'util';
import { createApp } from '../lib/app';
import * as globalConfig from '../lib/global-config';
import { GenericEvent } from '../lib/services/event-converters/generic';
import { GoveeIftttOnOrOffEvent } from '../lib/services/event-converters/govee-ifttt';
import { ZoomUserPresenceStatusUpdatedEvent } from '../lib/services/event-converters/zoom';
import { FsEventsService } from '../lib/services/events/fs-events-service';
import { ParticleAuthenticatorService } from '../lib/services/on-air-lights/particle-authenticator-service';
import { ParticleOnAirLightService } from '../lib/services/on-air-lights/particle-on-air-light-service';
import { EnvSecretsService } from '../lib/services/secrets/env-secrets-service';
import { FsUserStatesService } from '../lib/services/user-states/fs-user-states-service';

util.inspect.defaultOptions.depth = Infinity;

async function main(): Promise<void> {
	const baseDirPath: string = path.join(__dirname, 'data');

	const eventsService = new FsEventsService({
		baseDirPath,
	});

	const particle = new Particle();

	const secretsService = new EnvSecretsService();

	const particleAuthenticatorService = new ParticleAuthenticatorService({
		particle,
		secretsService,
	});

	const onAirLightService = new ParticleOnAirLightService(
		{
			deviceId: (await secretsService.getSecrets()).particleDeviceId,
		},
		{
			particle,
			particleAuthenticatorService,
			secretsService,
		},
	);

	const userStatesService = new FsUserStatesService({
		baseDirPath,
	});

	const app: express.Application = await createApp({
		eventsService,
		eventToUserStateConverters: [
			GoveeIftttOnOrOffEvent.convertToUserState,
			ZoomUserPresenceStatusUpdatedEvent.convertToUserState,
			GenericEvent.convertToUserState,
		],
		healthCheckServices: [
			eventsService,
			particleAuthenticatorService,
			secretsService,
			userStatesService,
		],
		onAirLightService,
		userStatesService,
	});

	const server: http.Server = app.listen(process.env.PORT, async () => {
		const address = server.address() as AddressInfo;
		console.info({ address });

		try {
			const tunnel = await localtunnel({
				local_host: address.address,
				port: address.port,
				subdomain: paramCase(globalConfig.appName),
			});
			console.info({ url: tunnel.url });
		} catch (error) {
			console.error({ error });
		}
	});
}

main();
