import { describe, it } from 'node:test';
import request from 'supertest';
import expect from 'expect';
import { ValidateEnv } from '@kishornaik/utils';
import { App } from '@/app';
import { modulesFederation } from '@/modules/app.Module';
import { CRequestDto } from '@/modules/moduleC/apps/features/v1/add';
import { bullMqRunner } from '@/shared/utils/helpers/bullMq';

process.env.NODE_ENV = 'development';
ValidateEnv();

const appInstance = new App([...modulesFederation]);
const app = appInstance.getServer();

describe(`Create-User-Integration-Test`, () => {
  //node --trace-deprecation --test --test-name-pattern='should_return_true_when_saga_success' --require ts-node/register -r tsconfig-paths/register ./src/modules/moduleC/tests/integrations/features/v1/add/index.test.ts
	it(`should_return_true_when_saga_success`, {timeout:9000000}, async () => {

    await bullMqRunner.runWorkers();

		const requestBody = new CRequestDto();
		requestBody.value1 = 2;
		requestBody.value2 = 3;

		const response = await request(app).post('/api/v1/c').send(requestBody);
		expect(response.body.Success).toBe(true);
		expect(response.statusCode).toBe(200);


	});
});
