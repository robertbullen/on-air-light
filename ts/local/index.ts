#!/usr/bin/env npx ts-node-script

import * as express from 'express';
import localtunnel from 'localtunnel';
import { AddressInfo } from 'net';
// @ts-ignore
import Particle from 'particle-api-js';
import * as util from 'util';
import { createApp } from '../lib/app';
import { MockEventsService } from '../lib/services/events/mock-events-service';
import { ParticleAuthenticatorService } from '../lib/services/on-air-lights/particle-authenticator-service';
import { ParticleOnAirLightService } from '../lib/services/on-air-lights/particle-on-air-light-service';
import { EnvSecretsService } from '../lib/services/secrets/env-secrets-service';
import { GoveeIftttOnOrOffEvent } from '../lib/services/user-states/govee-ifttt';
import { MockUserStatesService } from '../lib/services/user-states/mock-user-states-service';
import { ZoomUserPresenceStatusUpdatedEvent } from '../lib/services/user-states/zoom';

util.inspect.defaultOptions.depth = Infinity;

async function main(): Promise<void> {
	const eventsService = new MockEventsService();
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
	const userStatesService = new MockUserStatesService();

	const app: express.Application = await createApp({
		eventsService,
		eventToUserStateConverters: [
			GoveeIftttOnOrOffEvent.convertToUserState,
			ZoomUserPresenceStatusUpdatedEvent.convertToUserState,
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

	const server = app.listen(async () => {
		const address = server.address() as AddressInfo;
		console.info({ address });

		try {
			const tunnel = await localtunnel({
				local_host: address.address,
				port: address.port,
				subdomain: 'on-air-light',
			});
			console.info({ url: tunnel.url });
		} catch (error) {
			console.error({ error });
		}
	});
}

main();
