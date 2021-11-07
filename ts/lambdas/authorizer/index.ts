import * as util from 'util';
import { functionName } from '../../lib/logging';

util.inspect.defaultOptions.depth = Infinity;

export async function handler(
	event: AWSLambda.APIGatewayRequestAuthorizerEvent,
	_context: AWSLambda.Context,
	_callback: AWSLambda.Callback<AWSLambda.APIGatewayAuthorizerResult>,
): Promise<AWSLambda.APIGatewayAuthorizerResult> {
	const prefix: string = functionName(handler);
	console.info(prefix, { event });

	try {
		// Use `clientId` instead of AWS's default `X-Api-Key` because one client is hard-coded to
		// the former. Search for its value in a case-insensitive manner because nonstandard
		// headers have their case preserved by API Gateway.
		const apiKeyHeaderNameActualCase = 'clientId';
		const apiKeyHeaderNameLowerCase: string = apiKeyHeaderNameActualCase.toLowerCase();
		let apiKeyHeaderValue: string | undefined;
		for (const key in event.headers) {
			if (
				Object.prototype.hasOwnProperty.call(event.headers, key) &&
				key.toLowerCase() === apiKeyHeaderNameLowerCase
			) {
				apiKeyHeaderValue = event.headers[key];
				break;
			}
		}

		const result: AWSLambda.APIGatewayAuthorizerResult = {
			policyDocument: {
				Statement: [
					{
						Action: 'execute-api:Invoke',
						Effect: 'Allow',
						Resource: event.methodArn,
					},
				],
				Version: '2012-10-17',
			},
			principalId: `${apiKeyHeaderNameActualCase}-principal`,
			usageIdentifierKey: apiKeyHeaderValue,
		};

		console.info(prefix, { result });
		return result;
	} catch (error) {
		console.error(prefix, { error });
		throw error;
	}
}

const typeCheck: AWSLambda.APIGatewayRequestAuthorizerHandler = handler;
void typeCheck;
