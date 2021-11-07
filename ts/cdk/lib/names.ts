import * as globalConfig from '../../lib/global-config';

class IdAndName {
	public constructor(private readonly suffix: string) {}

	public get id(): string {
		return `${globalConfig.appName}${this.suffix}`;
	}

	public get name(): string {
		return this.id;
	}
}

export const names = {
	certificate: new IdAndName('Certificate'),
	hostedZone: new IdAndName('HostedZone'),
	restApi: new IdAndName('RestApi'),
	restApiARecord: new IdAndName('RestApiARecord'),
	restApiAuthorizerFunction: new IdAndName('RestApiAuthorizerFunction'),
	restApiDomainName: new IdAndName('RestApiDomainName'),
	restApiHandlerFunction: new IdAndName('RestApiHandlerFunction'),
	restApiKeyIfttt: new IdAndName('RestApiKeyIfttt'),
	restApiKeyZoom: new IdAndName('RestApiKeyZoom'),
	restApiRequestAuthorizer: new IdAndName('RestApiRequestAuthorizer'),
	restApiUsagePlan: new IdAndName('RestApiUsagePlan'),
	stack: new IdAndName('Stack'),
	table: new IdAndName('Table'),
};
