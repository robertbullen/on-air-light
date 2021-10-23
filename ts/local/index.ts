#!/usr/bin/env npx ts-node-script

import * as express from 'express';
import localtunnel from 'localtunnel';
import { AddressInfo } from 'net';
// @ts-ignore
import Particle from 'particle-api-js';
import * as util from 'util';
import { createApp } from '../lib/app';
import { ParticleAuthenticatorService } from '../lib/services/on-air-light/particle-authenticator-service';
import { ParticleOnAirLightService } from '../lib/services/on-air-light/particle-on-air-light-service';
import { EnvSecretsService } from '../lib/services/secrets/env-secrets-service';

util.inspect.defaultOptions.depth = Infinity;

async function main(): Promise<void> {
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

	const app: express.Application = await createApp({
		healthCheckServices: [particleAuthenticatorService, secretsService],
		onAirLightService,
		secretsService,
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
