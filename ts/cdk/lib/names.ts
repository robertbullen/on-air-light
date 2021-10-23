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
	restApiARecord: new IdAndName('RestApiARecord'),
	restApiDomainName: new IdAndName('RestApiDomainName'),
	restApi: new IdAndName('RestApi'),
	restApiHandler: new IdAndName('RestApiHandler'),
	stack: new IdAndName('Stack'),
};
