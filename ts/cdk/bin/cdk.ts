#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import 'source-map-support/register';
import { OnAirLightStack } from '../lib/on-air-light-stack';

const app = new cdk.App();
new OnAirLightStack(app);
