import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { S3CloudfrontCdkStack } from '../lib/s3-cloudfront-cdk-stack';
import { KubecostAddOn } from '@kubecost/kubecost-eks-blueprints-addon';
import * as config from 'config';




const app = new cdk.App();

// AddOns for the cluster.
const addOns: Array<blueprints.ClusterAddOn> = [
  new blueprints.addons.ArgoCDAddOn,
  new blueprints.addons.MetricsServerAddOn,
  new blueprints.addons.KarpenterAddOn,
  new blueprints.addons.AwsLoadBalancerControllerAddOn(),
  new blueprints.addons.CertManagerAddOn(),
  // new blueprints.addons.AdotCollectorAddOn(),
  // new blueprints.addons.CloudWatchAdotAddOn(),
  new blueprints.addons.VpcCniAddOn(),
  new blueprints.addons.CoreDnsAddOn(),
  new blueprints.addons.KubeProxyAddOn(),
  new blueprints.addons.EfsCsiDriverAddOn(),
  new KubecostAddOn(),

  // new blueprints.addons.EfsCsiDriverAddOn(),
  // new blueprints.addons.XrayAddOn()
];

const account = '';
const region = 'ap-northeast-1';
const env = process.env.CLUSTER_ENV;


let stackName = config.get('eksCdk.stackName') as string;

const stack = blueprints.EksBlueprint.builder()
  .account(account)
  .region(region)
  // do something with stack or drop this variable
  .addOns(...addOns)
  .build(app, stackName);

// add IRSA and Service account for backend-api, allow it to access dynamodb
let serviceAccount = stack.getClusterInfo().cluster.addServiceAccount('backend-api-service-account-id', {
  name: 'backend-api-service-account',
  namespace: 'default',
});

serviceAccount.addToPrincipalPolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: [
      "ecr:*"
    ],
    resources: [
      '*'
    ]
  }
));

serviceAccount.addToPrincipalPolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: [
    "dynamodb:*",
  ],
  resources: [
    `arn:aws:dynamodb:*:${account}:table/*`
  ]
}
));





new S3CloudfrontCdkStack(app, 'sd-gen-frontend-stack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  env: { account, region},

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
