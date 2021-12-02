import {
	APIGatewayProxyCallback,
	APIGatewayProxyEvent,
	APIGatewayProxyResult,
	Context,
} from 'aws-lambda';
import awsSdk from 'aws-sdk';
import { captureAWS } from 'aws-xray-sdk-core';
import * as express from 'express';
import Particle from 'particle-api-js';
import serverless from 'serverless-http';
import * as util from 'util';
import { createApp } from '../../lib/app';
import { functionName } from '../../lib/logging';
import { GenericEvent } from '../../lib/services/event-converters/generic';
import { GoveeIftttOnOrOffEvent } from '../../lib/services/event-converters/govee-ifttt';
import { ZoomUserPresenceStatusUpdatedEvent } from '../../lib/services/event-converters/zoom';
import { DynamoDbEventsService } from '../../lib/services/events/dynamodb-events-service';
import { ParticleAuthenticatorService } from '../../lib/services/on-air-lights/particle-authenticator-service';
import { ParticleOnAirLightService } from '../../lib/services/on-air-lights/particle-on-air-light-service';
import { SsmSecretsService } from '../../lib/services/secrets/ssm-secrets-service';
import { DynamoDbUserStatesService } from '../../lib/services/user-states/dynamodb-user-states-service';
import { env } from './environment-variables';

const AWS = captureAWS(awsSdk);
AWS.config.logger = console;

util.inspect.defaultOptions.depth = Infinity;

async function createServerlessHandler(): Promise<serverless.Handler> {
	const prefix: string = functionName(createServerlessHandler);
	console.info(prefix);

	// Create services.
	const secretsService = new SsmSecretsService({
		ssm: new AWS.SSM(),
	});

	const documentClient = new AWS.DynamoDB.DocumentClient();

	const eventsService = new DynamoDbEventsService(
		{
			tableName: env().TABLE_NAME,
		},
		{
			documentClient,
		},
	);

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

	const userStatesService = new DynamoDbUserStatesService(
		{
			tableName: env().TABLE_NAME,
		},
		{
			documentClient,
		},
	);

	// Create the Express application.
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

	// Wrap the Express application with serverless-http.
	const result: serverless.Handler = serverless(app);
	console.info(prefix, { result });
	return result;
}

export async function handler(
	event: APIGatewayProxyEvent,
	context: Context,
	_callback: APIGatewayProxyCallback,
): Promise<APIGatewayProxyResult> {
	const prefix: string = functionName(handler);
	console.info(prefix, { event });

	try {
		// Create the serverless handler upon first invocation.
		handler._serverlessHandler ??= await createServerlessHandler();

		// Process the event.
		const result = (await handler._serverlessHandler(event, context)) as APIGatewayProxyResult;

		console.info(prefix, { result });
		return result;
	} catch (error) {
		console.error(prefix, { error });
		throw error;
	}
}
handler._serverlessHandler = undefined as serverless.Handler | undefined;
