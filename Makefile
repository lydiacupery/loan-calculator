typescript_files := $(shell scripts/find-all-typescript-files)

dist/lambda/*.js: package.json yarn.lock $(typescript_files)
	yarn build:pre && \
	yarn build:server

deployment_bucket := loan-tf-lydia-lambda-bundles
deployment_key := loan-tf-lydia-loan-endpoint.zip
lambda_location := dist/deploy/archive.zip
lambda_function_name := loan-tf-loan-endpoint

all: $(lambda_location) dist/deploy/shared-node-runtime.zip dist/shared-node-runtime/nodejs/node_modules 
.PHONY: all

all_lambda: upload_lambda deploy_lambda publish_layer
.PHONY: all_lambda

$(lambda_location): dist/lambda/lambda.js
	zip -Xj $@ $<
	
# #shared lambda layer
# # Build the Lambda layer by bundling node_modules into a zip
dist/deploy/shared-node-runtime.zip: dist/shared-node-runtime/nodejs/node_modules | dist/lambda/lambda.js
	cd dist/shared-node-runtime; \
	zip -Xr ../deploy/shared-node-runtime.zip *

# Make directories when necessary
dist/deploy dist/shared-node-runtime/nodejs dist/deploy/lambda dist/lambda:
	mkdir -p $@

dist/shared-node-runtime/nodejs/node_modules: package.json yarn.lock | dist/shared-node-runtime/nodejs
# dist/shared-node-runtime/nodejs/node_modules: package.json yarn.lock 
	cp package.json yarn.lock dist/shared-node-runtime/nodejs/; \
	cd dist/shared-node-runtime/nodejs; \
	yarn install --production=true; \
	rm -f package.json yarn.lock


.PHONY: publish_layer
publish_layer:
	aws s3 cp dist/deploy/shared-node-runtime.zip "s3://$(deployment_bucket)/shared-node-runtime.zip" \
	&& aws lambda publish-layer-version \
		--layer-name "loan-tf-shared-node-runtime" \
		--content "S3Bucket=$(deployment_bucket),S3Key=shared-node-runtime.zip" \
		--description "Shared Node.js runtime for loan" \
		--compatible-runtimes nodejs10.x \
	| jq '.LayerVersionArn' > .aws_shared_layer; \
	if [ -s .aws_shared_layer ]; then exit 0; else exit 1; fi


#upload lambda
.PHONY: upload_lambda
upload_lambda: 
	aws s3 cp $(lambda_location) "s3://$(deployment_bucket)/$(deployment_key)" 

.PHONY: deploy_lambda
deploy_lambda:
	aws lambda \
		update-function-code \
		--function-name $(lambda_function_name) \
		--s3-bucket "$(deployment_bucket)" \
		--s3-key "$(deployment_key)"
	aws lambda \
		update-function-configuration \
		--function-name $(lambda_function_name) \
		--layers $(shell cat .aws_shared_layer) \


# react app
.PHONY: deploy_react_app
deploy_react_app: clean
	yarn install --production=false && \
	yarn build:client-deployment-bundle && \
	scripts/copy-static-assets-to-s3

.PHONY: clean
clean:
	rm -rf $(deadwood)

deadwood := \
	.shared-runtime-latest-arn \
	.*-uploaded \
	.*-deployed \
	.test-databases-setup \
	.generated-json-schema-types \
	.generated-graphql-types \
	dist