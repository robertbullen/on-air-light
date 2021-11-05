#!/usr/bin/env npx ts-node-script

// @ts-ignore
import Particle from 'particle-api-js';
import {
	Color,
	OnAirLightState,
	Pattern,
} from '../lib/services/on-air-lights/on-air-light-service';
import { ParticleAuthenticatorService } from '../lib/services/on-air-lights/particle-authenticator-service';
import { ParticleOnAirLightService } from '../lib/services/on-air-lights/particle-on-air-light-service';
import { EnvSecretsService } from '../lib/services/secrets/env-secrets-service';

async function main(): Promise<void> {
	const secretsService = new EnvSecretsService();
	const particle = new Particle();
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

	let getState = await onAirLightService.getState();
	console.log({ getState });

	const colors = Object.values(Color);
	const durations = [500, 1000, 2000, 4000];
	const patterns = Object.values(Pattern);

	while (true) {
		const setState: Partial<OnAirLightState> = {
			color: Math.round(Math.random())
				? colors[Math.trunc(Math.random() * colors.length)]
				: undefined,
			duration: Math.round(Math.random())
				? durations[Math.trunc(Math.random() * durations.length)]
				: undefined,
			pattern: Math.round(Math.random())
				? patterns[Math.trunc(Math.random() * patterns.length)]
				: undefined,
		};
		const getState = await onAirLightService.setState(setState);
		console.log({ setState, getState });
		await new Promise((resolve) => setTimeout(resolve, Math.max(...durations) * 2));
	}
}

main();
