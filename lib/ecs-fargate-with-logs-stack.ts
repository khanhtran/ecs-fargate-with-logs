import * as cdk from '@aws-cdk/core'
import * as ec2 from '@aws-cdk/aws-ec2'
import { SecurityGroup, Vpc } from "@aws-cdk/aws-ec2";
import * as ecs from '@aws-cdk/aws-ecs'
import * as iam from '@aws-cdk/aws-iam'
import * as ecs_patterns from "@aws-cdk/aws-ecs-patterns"
import { join } from 'path';
import { AwsLogDriver, FirelensConfigFileType, FirelensLogRouterType, LogDrivers } from '@aws-cdk/aws-ecs';
import { ServicePrincipal } from '@aws-cdk/aws-iam';

export class EcsFargateWithLogsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // firelens image for extra configurations
    // DockerImageCode.fromImageAsset(join(__dirname, '../firelens')),
    // the cluster with task definition
    const vpc = Vpc.fromLookup(this, "kxt29-vpc", { vpcId: 'vpc-0b163940bddf70a43' })

    const cluster = new ecs.Cluster(this, "kxt29-Cluster", {
      vpc: vpc
    });


    // Create a load-balanced Fargate service
    new ecs.FargateService(this, "kxt29-FargateService", {
      cluster: cluster, // Required
      taskDefinition: this.createTaskDefinition()
    });
  }

  createTaskDefinition(): ecs.FargateTaskDefinition {

    // define task definition
    const fargateTaskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      taskRole: this.createTaskRole()
      // volumes : [
      //   {
      //     name : "var-log"
      //   }
      // ]
    });

    // the side car container
    // fargateTaskDefinition.addFirelensLogRouter('log-router', {
    //   image: ecs.ContainerImage.fromAsset(join(__dirname, '../aws-for-fluent-bit')),
    //   essential: true,
    //   firelensConfig: {
    //     type: FirelensLogRouterType.FLUENTBIT,
    //     //options: {              
    //     //configFileType: FirelensConfigFileType.FILE,              
    //     //configFileValue: '/extra.conf'
    //     //}
    //   },
    //   memoryReservationMiB: 50,
    //   logging: new AwsLogDriver({ streamPrefix: 'firelens' })
    // });

    // the main container
    fargateTaskDefinition.addContainer('app', {
      // Use an image from DockerHub
      essential: true,
      image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      containerName: 'app',
      logging: LogDrivers.firelens({
        options: {
          Name: 'cloudwatch',
          region: 'us-east-2',
          log_group_name: 'firelens-blog',
          auto_create_group: 'true',
          log_stream_prefix: 'app',
          'log-driver-buffer-limit': '2097152'
        }
      })
    });

    return fargateTaskDefinition
  }

  createTaskRole(): iam.IRole {
    return new iam.Role(this, 'Role', {
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
}
