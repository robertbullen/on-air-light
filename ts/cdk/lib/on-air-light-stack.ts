import * as apigw from '@aws-cdk/aws-apigateway';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as route53 from '@aws-cdk/aws-route53';
import * as route53Targets from '@aws-cdk/aws-route53-targets';
import * as cdk from '@aws-cdk/core';
import { paramCase } from 'change-case';
import { EnvironmentVariables } from '../../lambdas/handler/environment-variables';
import { ItemKey } from '../../lib/dynamodb';
import * as globalConfig from '../../lib/global-config';
import { names } from './names';

type DefaultFunctionProps = Pick<
	lambda.FunctionProps,
	'architecture' | 'handler' | 'memorySize' | 'runtime'
>;

export class OnAirLightStack extends cdk.Stack {
	constructor(scope: cdk.Construct) {
		super(scope, names.stack.id, {
			env: { account: '761550682392', region: 'us-east-1' },
			stackName: names.stack.name,
		});

		const appDomainName = `${paramCase(globalConfig.appName)}.${globalConfig.domain}`;
		const apiDomainName = `api.${appDomainName}`;
		const defaultFunctionProps: DefaultFunctionProps = {
			architecture: lambda.Architecture.ARM_64,
			handler: 'index.handler',
			memorySize: 1024,
			runtime: lambda.Runtime.NODEJS_14_X,
		};

		const hostedZone = this.importHostedZone();

		const certificate = this.createCertificate({
			apiDomainName,
			appDomainName,
			hostedZone,
		});

		const restApiAuthorizerFunction: lambda.Function = this.createRestApiAuthorizerFunction({
			defaultFunctionProps,
		});

		const table: dynamodb.Table = this.createTable();

		const restApiHandlerFunction: lambda.Function = this.createRestApiHandlerFunction({
			defaultFunctionProps,
			table,
		});

		this.createRestApi({
			apiDomainName,
			certificate,
			hostedZone,
			restApiAuthorizerFunction,
			restApiHandlerFunction,
		});
	}

	private createCertificate({
		apiDomainName,
		appDomainName,
		hostedZone,
	}: {
		apiDomainName: string;
		appDomainName: string;
		hostedZone: route53.IHostedZone;
	}): acm.Certificate {
		return new acm.DnsValidatedCertificate(this, names.certificate.id, {
			domainName: appDomainName,
			hostedZone,
			subjectAlternativeNames: [apiDomainName],
		});
	}

	private createRestApi({
		apiDomainName,
		certificate,
		restApiAuthorizerFunction,
		restApiHandlerFunction,
		hostedZone,
	}: {
		apiDomainName: string;
		certificate: acm.Certificate;
		restApiAuthorizerFunction: lambda.Function;
		restApiHandlerFunction: lambda.Function;
		hostedZone: route53.IHostedZone;
	}): apigw.RestApi {
		const restApi = new apigw.LambdaRestApi(this, names.restApi.id, {
			apiKeySourceType: apigw.ApiKeySourceType.AUTHORIZER,
			defaultMethodOptions: {
				apiKeyRequired: true,
				authorizer: new apigw.RequestAuthorizer(this, names.restApiRequestAuthorizer.id, {
					authorizerName: names.restApiRequestAuthorizer.name,
					handler: restApiAuthorizerFunction,
					identitySources: [],
				}),
			},
			deployOptions: {
				stageName: 'v1',
				tracingEnabled: true,
			},
			domainName: {
				certificate,
				domainName: apiDomainName,
				endpointType: apigw.EndpointType.EDGE,
				securityPolicy: apigw.SecurityPolicy.TLS_1_2,
			},
			handler: restApiHandlerFunction,
			restApiName: names.restApi.name,
		});

		// Create a usage plan and API key.
		const usagePlan: apigw.UsagePlan = restApi.addUsagePlan(names.restApiUsagePlan.id, {
			apiStages: [{ stage: restApi.deploymentStage }],
			name: names.restApiUsagePlan.name,
			quota: {
				period: apigw.Period.MONTH,
				limit: 1e5,
			},
			throttle: {
				burstLimit: 100,
				rateLimit: 100,
			},
		});

		const apiKey: apigw.IApiKey = restApi.addApiKey(names.restApiKey.id, {
			apiKeyName: names.restApiKey.name,
		});

		usagePlan.addApiKey(apiKey);

		new route53.ARecord(this, names.restApiARecord.id, {
			recordName: apiDomainName,
			target: route53.RecordTarget.fromAlias(new route53Targets.ApiGateway(restApi)),
			zone: hostedZone,
		});

		return restApi;
	}

	private createRestApiAuthorizerFunction({
		defaultFunctionProps,
	}: {
		defaultFunctionProps: DefaultFunctionProps;
	}): lambda.Function {
		return new lambda.Function(this, names.restApiAuthorizerFunction.id, {
			...defaultFunctionProps,
			code: lambda.Code.fromAsset('../lambdas/dist/authorizer/'),
			functionName: names.restApiAuthorizerFunction.name,
			timeout: cdk.Duration.seconds(3),
		});
	}

	private createRestApiHandlerFunction({
		defaultFunctionProps,
		table,
	}: {
		defaultFunctionProps: DefaultFunctionProps;
		table: dynamodb.Table;
	}): lambda.Function {
		const environment: EnvironmentVariables = {
			TABLE_NAME: table.tableName,
		};

		return new lambda.Function(this, names.restApiHandlerFunction.id, {
			...defaultFunctionProps,
			code: lambda.Code.fromAsset('../lambdas/dist/handler/'),
			environment: environment as unknown as Record<string, string>,
			functionName: names.restApiHandlerFunction.name,
			initialPolicy: [
				new iam.PolicyStatement({
					actions: ['ssm:GetParameters'],
					effect: iam.Effect.ALLOW,
					resources: [
						`arn:aws:ssm:${this.region}:${this.account}:parameter/${globalConfig.appName}/*`,
					],
				}),
				new iam.PolicyStatement({
					actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:Query'],
					effect: iam.Effect.ALLOW,
					resources: [table.tableArn],
				}),
			],
			timeout: cdk.Duration.seconds(30),
			tracing: lambda.Tracing.ACTIVE,
		});
	}

	private createTable(): dynamodb.Table {
		function keyName<T>(fieldName: keyof T): keyof T {
			return fieldName;
		}

		return new dynamodb.Table(this, names.table.id, {
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
			partitionKey: {
				name: keyName<ItemKey>('primaryKey'),
				type: dynamodb.AttributeType.STRING,
			},
			sortKey: {
				name: keyName<ItemKey>('sortKey'),
				type: dynamodb.AttributeType.STRING,
			},
			tableName: names.table.name,
		});
	}

	private importHostedZone(): route53.IHostedZone {
		return route53.HostedZone.fromLookup(this, names.hostedZone.id, {
			domainName: globalConfig.domain,
		});
	}
}
