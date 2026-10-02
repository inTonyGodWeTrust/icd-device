# ICD Device Tests
This framework was developed for validation of a satellite star tracker 3000 (made up name) and its web console.
Framework based on Playwright, written in TypeScript. It contains ICD, API and UI tests.

## What is tested
The star tracker is a satellite device. The document that describes it is called ICD (Interface Control Document): [icd/star-tracker.yaml](icd/star-tracker.yaml).
The ICD says which modes the device has, which commands it accepts and which values are allowed.

The device can be controlled in two ways:
* API of the device simulator - http://localhost:4310 (starts automatically with the tests)
* Device Console - web site at http://localhost:4200 (should be developed)

All limits in the tests (min, max, modes, warning temperature) are taken from the ICD, not written by hand.
If the ICD changes, the tests check the new values.

## Device Console
Device Console is the web page an operator uses to control the star tracker. The page has:
* Telemetry table - every value from the device (mode, temperature, exposure, counter, temp_warn) with unit and status OK / WARNING
* Mode - dropdown and "Set mode" button
* Exposure, ms - input and "Set exposure" button
* "Refresh telemetry" button
* Result message under the buttons - "Command accepted" or the reason of rejection (OUT_OF_RANGE, FORBIDDEN_IN_MODE ...)

The console opens with `?session=<id>` in the url, so every UI test works with its own device.

## Framework structure
[playwright.config.ts](playwright.config.ts) is the main file in which the conditions for the test are set. It has 3 projects: icd, api and ui. Api and ui tests start only after icd tests passed.

[icd](icd) - ICD of the device

[src](src) - device simulator

[pages](pages) - Project Pages: device API (deviceApi.ts), Device Console page (consolePage.ts) and constants

[tests/fixtures.ts](tests/fixtures.ts) - fixtures: icd, device, consolePage

[tests/icd](tests/icd) - checks of the ICD itself: units, ranges, modes

[tests/api](tests/api) - commands and telemetry through the API

[tests/ui](tests/ui) - Device Console tests. Data is prepared through the API, actions are done on the page, result is checked on the page and in the API

## Test cases
#### ICD
* Every number has unit, min and max
* Modes in commands are the same as the list of modes
* Command limits are the same as telemetry limits
* Warning temperature is inside the temperature range

#### API
* SET_MODE works for every mode from the ICD
* SET_EXPOSURE: min - 1, min, max, max + 1
* SET_EXPOSURE is not allowed in CALIBRATION mode
* Wrong commands are rejected and the device state is not changed
* Telemetry values are inside the ICD ranges
* Counter goes up by 1 and goes from 65535 to 0
* temp_warn turns on above the warning temperature

#### UI
* Telemetry table shows every value from the ICD with its unit
* Mode set on the page is changed on the device
* Too big exposure shows OUT_OF_RANGE and does not change the device
* Exposure change in CALIBRATION shows FORBIDDEN_IN_MODE
* High temperature is shown as WARNING

## Get Started
#### 1. Clone the repository:
    git clone https://github.com/inTonyGodWeTrust/icd-device-tests.git
#### 2. Go to the project folder:
    cd icd-device-tests
#### 3. Install dependencies:
    npm ci

## Run the tests
#### ICD and API tests:
    npx playwright test
#### UI tests (Device Console must be running):
    npx playwright install chromium
    UI_URL=http://localhost:4200 npx playwright test --project=ui
#### Open the report:
    npx playwright show-report output/report

## Get Started with Make
#### 1. Install:
    make install
#### 2. Run:
    make test

## Get Started with Docker
#### 1. Build the image:
    make build-docker-image
#### 2. Run the tests in container:
    make run-docker-container
Report will be in the output folder.
