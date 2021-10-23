import { expect as expectCDK, MatchStyle, matchTemplate } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { OnAirLightStack } from '../lib/on-air-light-stack';

test('Empty Stack', () => {
	const app = new cdk.App();
	// WHEN
	const stack = new OnAirLightStack(app);
	// THEN
	expectCDK(stack).to(
		matchTemplate(
			{
				Resources: {},
			},
			MatchStyle.EXACT,
		),
	);
});
