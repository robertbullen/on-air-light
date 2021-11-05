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
		let apiKeyHeaderName: string | undefined;
		let apiKeyHeaderValue: string | undefined;
		if (event.headers) {
			for (const headerName of ['x-api-key', 'clientid']) {
				if (headerName in event.headers) {
					apiKeyHeaderName = headerName;
					apiKeyHeaderValue = event.headers[headerName];
				}
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
			principalId: `${apiKeyHeaderName ?? 'unspecified'}-principal`,
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
