IMAGE ?= icd-device-tests:latest

install:
	npm ci

test:
	npx playwright test

build-docker-image:
	docker build -t $(IMAGE) .

run-docker-container:
	docker run --rm -v $(PWD)/output:/app/output $(IMAGE)

.PHONY: install test build-docker-image run-docker-container
