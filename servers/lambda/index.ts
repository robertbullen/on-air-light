import awsSdk, { SSM } from 'aws-sdk';
import { captureAWS } from 'aws-xray-sdk-core';
import * as path from 'path';
import serverless from 'serverless-http';
import * as util from 'util';
import { createApp, CreateAppParams } from '../lib/app';

const AWS = captureAWS(awsSdk);
AWS.config.logger = console;

util.inspect.defaultOptions.depth = Infinity;

function functionName(func: Function): string {
	return `${func.name}()`;
}

async function createServerlessHandler(): Promise<AWSLambda.APIGatewayProxyHandler> {
	const prefix: string = functionName(createServerlessHandler);
	console.info(prefix);

	// Load secrets from SSM Parameter Store.
	const paramPath = 'OnAirLight';
	const ssmParameters: Record<keyof CreateAppParams, string> = {
		particleDeviceId: path.posix.join(paramPath, 'PARTICLE_DEVICE_ID'),
		particlePassword: path.posix.join(paramPath, 'PARTICLE_PASSWORD'),
		particleUsername: path.posix.join(paramPath, 'PARTICLE_USERNAME'),
		zoomClientId: path.posix.join(paramPath, 'ZOOM_CLIENT_ID'),
	};
	const ssmParameterNames: string[] = Object.values(ssmParameters);

	const getParametersInput: SSM.GetParametersRequest = {
		Names: ssmParameterNames,
		WithDecryption: true,
	};
	const getParametersOutput: SSM.GetParametersResult = await new AWS.SSM()
		.getParameters(getParametersInput)
		.promise();
	if (
		getParametersOutput.Parameters?.length !== ssmParameterNames.length ||
		getParametersOutput.InvalidParameters?.length
	) {
		throw new Error();
	}

	function findParameterValueOrThrow(parameterName: string): string {
		const parameter = getParametersOutput.Parameters?.filter(
			(parameter) => parameter.Name === parameterName,
		)[0];
		if (!parameter?.Value) {
			throw new Error();
		}
		return parameter.Value;
	}

	// Create the Express application.
	const createAppArgs: CreateAppParams = {
		particleDeviceId: findParameterValueOrThrow(ssmParameters.particleDeviceId),
		particlePassword: findParameterValueOrThrow(ssmParameters.particlePassword),
		particleUsername: findParameterValueOrThrow(ssmParameters.particleUsername),
		zoomClientId: findParameterValueOrThrow(ssmParameters.zoomClientId),
	};
	const app = createApp(createAppArgs);

	// Wrap the Express application with serverless-http.
	const result = serverless(app) as AWSLambda.APIGatewayProxyHandler;
	console.info(prefix, { result });

	return result;
}

export default async function handler(
	event: AWSLambda.APIGatewayProxyEvent,
	context: AWSLambda.Context,
	callback: AWSLambda.APIGatewayProxyCallback,
): Promise<void | AWSLambda.APIGatewayProxyResult> {
	const prefix: string = functionName(handler);
	console.info(prefix, { event });

	try {
		const serverlessHandler = await handler._serverlessHandlerPromise;

		const result = await serverlessHandler(event, context, callback);
		console.info(prefix, { result });
		return result;
	} catch (error) {
		console.error(prefix, { error });
		throw error;
	}
}
handler._serverlessHandlerPromise = createServerlessHandler();
