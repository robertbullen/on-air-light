import * as apigw from '@aws-cdk/aws-apigateway';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as route53 from '@aws-cdk/aws-route53';
import * as route53Targets from '@aws-cdk/aws-route53-targets';
import * as cdk from '@aws-cdk/core';
import { paramCase } from 'change-case';
import * as globalConfig from '../../lib/global-config';
import { names } from './names';

export class OnAirLightStack extends cdk.Stack {
	constructor(scope: cdk.Construct) {
		super(scope, names.stack.id, {
			env: { account: '761550682392', region: 'us-east-1' },
			stackName: names.stack.name,
		});

		const appDomainName = `${paramCase(globalConfig.appName)}.${globalConfig.domain}`;
		const apiDomainName = `api.${appDomainName}`;

		const hostedZone = this.importHostedZone();
		const certificate = this.createCertificate({ apiDomainName, appDomainName, hostedZone });
		const handler = this.createRestApiHandler();
		this.createRestApi({ apiDomainName, appDomainName, certificate, handler, hostedZone });
	}

	private importHostedZone(): route53.IHostedZone {
		return route53.HostedZone.fromLookup(this, names.hostedZone.id, {
			domainName: globalConfig.domain,
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

	private createRestApiHandler(): lambda.Function {
		return new lambda.Function(this, names.restApiHandler.id, {
			code: lambda.Code.fromAsset('../lambda/dist/'),
			functionName: names.restApiHandler.name,
			handler: 'index.handler',
			initialPolicy: [
				new iam.PolicyStatement({
					actions: ['ssm:GetParameters'],
					effect: iam.Effect.ALLOW,
					resources: [
						`arn:aws:ssm:${this.region}:${this.account}:parameter/${globalConfig.appName}/*`,
					],
				}),
			],
			runtime: lambda.Runtime.NODEJS_14_X,

			timeout: cdk.Duration.seconds(30),
			tracing: lambda.Tracing.ACTIVE,
		});
	}

	private createRestApi({
		apiDomainName,
		appDomainName,
		certificate,
		handler,
		hostedZone,
	}: {
		appDomainName: string;
		apiDomainName: string;
		certificate: acm.Certificate;
		handler: lambda.Function;
		hostedZone: route53.IHostedZone;
	}): apigw.RestApi {
		const restApi = new apigw.LambdaRestApi(this, names.restApi.id, {
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
			handler,
			restApiName: names.restApi.name,
		});

		// const restApiDomainName = new apigw.DomainName(this, names.restApiDomainName.id, {
		// 	certificate,
		// 	domainName: apiDomainName,
		// 	endpointType: apigw.EndpointType.EDGE,
		// 	securityPolicy: apigw.SecurityPolicy.TLS_1_2,
		// });
		// restApiDomainName.addBasePathMapping(restApi);

		new route53.ARecord(this, names.restApiARecord.id, {
			recordName: apiDomainName,
			target: route53.RecordTarget.fromAlias(new route53Targets.ApiGateway(restApi)),
			zone: hostedZone,
		});

		return restApi;
	}
}
