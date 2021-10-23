import awsSdk from 'aws-sdk';
import { captureAWS } from 'aws-xray-sdk-core';
import * as express from 'express';
import Particle from 'particle-api-js';
import serverless from 'serverless-http';
import * as util from 'util';
import { createApp } from '../lib/app';
import { functionName } from '../lib/logging';
import { ParticleAuthenticatorService } from '../lib/services/on-air-light/particle-authenticator-service';
import { ParticleOnAirLightService } from '../lib/services/on-air-light/particle-on-air-light-service';
import { SsmSecretsService } from '../lib/services/secrets/ssm-secrets-service';

const AWS = captureAWS(awsSdk);
AWS.config.logger = console;

util.inspect.defaultOptions.depth = Infinity;

async function createServerlessHandler(): Promise<AWSLambda.APIGatewayProxyHandler> {
	const prefix: string = functionName(createServerlessHandler);
	console.info(prefix);

	// Create services.
	const particle = new Particle();
	const secretsService = new SsmSecretsService({ ssm: new AWS.SSM() });
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

	// Create the Express application.
	const app: express.Application = await createApp({
		healthCheckServices: [particleAuthenticatorService, secretsService],
		onAirLightService,
		secretsService,
	});

	// Wrap the Express application with serverless-http.
	const result = serverless(app) as AWSLambda.APIGatewayProxyHandler;
	console.info(prefix, { result });
	return result;
}

export async function handler(
	event: AWSLambda.APIGatewayProxyEvent,
	context: AWSLambda.Context,
	callback: AWSLambda.APIGatewayProxyCallback,
): Promise<void | AWSLambda.APIGatewayProxyResult> {
	const prefix: string = functionName(handler);
	console.info(prefix, { event });

	try {
		// Create the serverless handler upon first invocation.
		handler._serverlessHandler ??= await createServerlessHandler();

		// Process the event.
		const result = await handler._serverlessHandler(event, context, callback);

		console.info(prefix, { result });
		return result;
	} catch (error) {
		console.error(prefix, { error });
		throw error;
	}
}
handler._serverlessHandler = undefined as AWSLambda.APIGatewayProxyHandler | undefined;
