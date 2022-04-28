import * as cdk from '@aws-cdk/core'
import * as ec2 from '@aws-cdk/aws-ec2'
import { SecurityGroup, Vpc } from "@aws-cdk/aws-ec2";
import * as ecs from '@aws-cdk/aws-ecs'
import * as ecr from '@aws-cdk/aws-ecr'
import * as iam from '@aws-cdk/aws-iam'
import * as ecs_patterns from "@aws-cdk/aws-ecs-patterns"
import { join } from 'path';
import { AwsLogDriver, FirelensConfigFileType, FirelensLogRouterType, LogDrivers } from '@aws-cdk/aws-ecs';
import { ServicePrincipal } from '@aws-cdk/aws-iam';

export class EcsFargateWithFluentBit extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    // const vpc = Vpc.fromLookup(this, "kxt29-vpc", { vpcId: 'vpc-0b163940bddf70a43' })
    const cluster = new ecs.Cluster(this, "kxt29-Cluster", {
      // vpc: vpc
    });

    
    new ecs.FargateService(this, "kxt29-FargateService", {
      cluster: cluster,
      taskDefinition: this.createTaskDefinition()
    });
  }


  createTaskDefinition(): ecs.FargateTaskDefinition {
    const fargateTaskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      executionRole: this.createExecutionRole(),
      taskRole: this.createTaskRole()
    });
    
    fargateTaskDefinition.addFirelensLogRouter('log-router', {
      image: ecs.ContainerImage.fromAsset(join(__dirname, '../aws-for-fluent-bit')),
      essential: true,
      firelensConfig: {
        type: FirelensLogRouterType.FLUENTBIT,
        options: {              
          configFileType: FirelensConfigFileType.FILE,              
          configFileValue: '/extra.conf'
        }
      },
      logging: new AwsLogDriver({ streamPrefix: 'fluentbit' })
    });
    
    fargateTaskDefinition.addContainer('app', {
      essential: true,
      image:ecs.ContainerImage.fromRegistry('793726277289.dkr.ecr.us-east-2.amazonaws.com/log-demo:v1'),
      logging: LogDrivers.firelens({})
    });

    return fargateTaskDefinition
  }

  createTaskRole(): iam.IRole {
    return new iam.Role(this, 'TaskRole', {
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
      roleName: 'cas-ecs-task-role',
      inlinePolicies: {
        'task-policy': new iam.PolicyDocument({
          statements: [new iam.PolicyStatement({
            actions: [
              "logs:CreateLogStream",
              "logs:CreateLogGroup",
              "logs:DescribeLogStreams",
              "logs:PutLogEvents"
            ],
            effect: iam.Effect.ALLOW,
            resources: ["*"]
          })]
        })
      }
    });
  }

  createExecutionRole(): iam.Role {
    return new iam.Role(this, 'ExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      roleName: 'cas-ecs-execution-role',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
      ]
    })    
  } 
}
