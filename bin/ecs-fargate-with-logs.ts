#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ManagedPolicy, PermissionsBoundary } from '@aws-cdk/aws-iam';
import { EcsFargateWithFluentBit } from '../lib/ecs-fargate-with-fluent-bit-stack';

const app = new cdk.App();
const env = {
  account:'793726277289',
  region: 'us-east-2'
}
const stack = new EcsFargateWithFluentBit(app, 'EcsFargateWithFluentBit', {
  env: env
});


// const boundary = ManagedPolicy.fromManagedPolicyArn(stack, 'boundary', `arn:aws:iam::${env.account}:policy/cas-infrastructure/permission-boundary-policy`)
// PermissionsBoundary.of(stack).apply(boundary)
