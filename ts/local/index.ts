#!/usr/bin/env npx ts-node-script

import { paramCase } from 'change-case';
import * as express from 'express';
import localtunnel from 'localtunnel';
import { AddressInfo } from 'net';
// @ts-ignore
import Particle from 'particle-api-js';
import * as util from 'util';
import { createApp } from '../lib/app';
import * as globalConfig from '../lib/global-config';
import { GenericEvent } from '../lib/services/event-converters/generic';
import { GoveeIftttOnOrOffEvent } from '../lib/services/event-converters/govee-ifttt';
import { ZoomUserPresenceStatusUpdatedEvent } from '../lib/services/event-converters/zoom';
import { MockEventsService } from '../lib/services/events/mock-events-service';
import { ParticleAuthenticatorService } from '../lib/services/on-air-lights/particle-authenticator-service';
import { ParticleOnAirLightService } from '../lib/services/on-air-lights/particle-on-air-light-service';
import { EnvSecretsService } from '../lib/services/secrets/env-secrets-service';
import { MockUserStatesService } from '../lib/services/user-states/mock-user-states-service';

util.inspect.defaultOptions.depth = Infinity;

async function main(): Promise<void> {
	const eventsService = new MockEventsService();

	async function eventKeyToUrlPart(eventKey: string): Promise<string> {
		return eventKey;
	}
	async function eventKeyFromUrlPart(urlPart: string): Promise<string> {
		return urlPart;
	}

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
		eventKeyFromUrlPart,
		eventKeyToUrlPart,
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

	const server = app.listen(async () => {
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
