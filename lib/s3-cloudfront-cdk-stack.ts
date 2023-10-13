import {Construct} from 'constructs';
import {
  CachePolicy,
  Distribution,
  HttpVersion,
  OriginAccessIdentity,
  OriginProtocolPolicy,
  ErrorResponse,
  ResponseHeadersPolicy,
  AllowedMethods,
  OriginRequestPolicy,
  OriginRequestHeaderBehavior,
  OriginRequestQueryStringBehavior, OriginRequestCookieBehavior
} from "aws-cdk-lib/aws-cloudfront";
import {HttpOrigin, S3Origin} from "aws-cdk-lib/aws-cloudfront-origins";
import {Bucket, BucketAccessControl} from "aws-cdk-lib/aws-s3";
import {CfnOutput, Stack, StackProps, Duration} from "aws-cdk-lib";
import * as config from 'config';

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class S3CloudfrontCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    let bucket = new Bucket(this, 'sd-gen-frontend-bucket', {
      accessControl: BucketAccessControl.PRIVATE,
    });

    const originAccessIdentity = new OriginAccessIdentity(this, 'OriginAccessIdentity');
    bucket.grantRead(originAccessIdentity);

    let frontendDistribution = new Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      errorResponses: [{
        httpStatus: 403,
        responseHttpStatus: 200,
        responsePagePath: '/index.html',
        ttl: Duration.minutes(30),
      }, {
        httpStatus: 404,
        responseHttpStatus: 200,
        responsePagePath: '/index.html',
        ttl: Duration.minutes(30),
      }],
      defaultBehavior: {
        origin: new S3Origin(bucket, {originAccessIdentity}),
        responseHeadersPolicy: ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS
      },
    });

    let originRequestPolicy = new OriginRequestPolicy(this, 'sd-gen-origin-policy', {
      headerBehavior: OriginRequestHeaderBehavior.all('CloudFront-Viewer-Country'),
      queryStringBehavior: OriginRequestQueryStringBehavior.all(),
      cookieBehavior: OriginRequestCookieBehavior.all(),
      originRequestPolicyName: 'sd-gen-backend-api-request-policy-cdk'
    });


    let bakcendApiEndpoint = config.get('frontendCdk.backendApiEndpoint') as string;

    let apiCloudfront = new Distribution(this, 'sd-gen-backend-api-cf', {
      defaultBehavior: {
        origin: new HttpOrigin(bakcendApiEndpoint, {
          protocolPolicy: OriginProtocolPolicy.HTTP_ONLY
        }),
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: CachePolicy.CACHING_DISABLED,
        originRequestPolicy: originRequestPolicy
      },
      httpVersion: HttpVersion.HTTP2_AND_3
    });

    new CfnOutput(this, 'frontend-distribution-name', {value: frontendDistribution.distributionDomainName});
    new CfnOutput(this, 'backend-api-distribution-name', {value: apiCloudfront.distributionDomainName});
    new CfnOutput(this, 'sd-gen-frontend-bucket-name', {value: bucket.bucketName});
  }
}
