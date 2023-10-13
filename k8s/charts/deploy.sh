#!/bin/bash

helm package ./webui-automatic1111-chart

CHART_VERSION=$(helm show chart ./webui-automatic1111-chart | grep version: | awk '{print $2}')

aws ecr get-login-password \
--region ap-northeast-1 | helm registry login \
--username AWS \
--password-stdin xxxxxx.dkr.ecr.ap-northeast-1.amazonaws.com

helm push webui-automatic1111-chart-$CHART_VERSION.tgz oci://xxxxxx.dkr.ecr.ap-northeast-1.amazonaws.com/

rm ./webui-automatic1111-chart-$CHART_VERSION.tgz