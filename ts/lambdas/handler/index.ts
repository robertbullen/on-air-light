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
import { DynamoDbEventsService } from '../../lib/services/events/dynamodb-events-service';
import { ParticleAuthenticatorService } from '../../lib/services/on-air-lights/particle-authenticator-service';
import { ParticleOnAirLightService } from '../../lib/services/on-air-lights/particle-on-air-light-service';
import { SsmSecretsService } from '../../lib/services/secrets/ssm-secrets-service';
import { DynamoDbUserStatesService } from '../../lib/services/user-states/dynamodb-user-states-service';
import { GoveeIftttOnOrOffEvent } from '../../lib/services/user-states/govee-ifttt';
import { ZoomUserPresenceStatusUpdatedEvent } from '../../lib/services/user-states/zoom';
import { env } from './environment-variables';

const AWS = captureAWS(awsSdk);
AWS.config.logger = console;

util.inspect.defaultOptions.depth = Infinity;

async function createServerlessHandler(): Promise<serverless.Handler> {
	const prefix: string = functionName(createServerlessHandler);
	console.info(prefix);

	// Create services.
	const tableName: string = env().TABLE_NAME;
	const documentClient = new AWS.DynamoDB.DocumentClient();
	const eventsService = new DynamoDbEventsService(
		{
			tableName,
		},
		{
			documentClient,
		},
	);
	const particle = new Particle();
	const secretsService = new SsmSecretsService({
		ssm: new AWS.SSM(),
	});
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
			tableName,
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
