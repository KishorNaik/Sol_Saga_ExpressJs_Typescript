import { logger } from '@/shared/utils/helpers/loggers';
import {
	bullMqRedisConnection,
	JsonString,
	ReplyMessageBullMq,
	RequestReplyConsumerBullMq,
} from '@kishornaik/utils';

const queueName = `moduleA-compensate-queue`;
const consumer = new RequestReplyConsumerBullMq(bullMqRedisConnection);

//#region Event Listener
export const moduleACompensateEventListener = async () => {
	const worker = await consumer.startConsumingAsync<string, string>(queueName, async (reply) => {
		logger.info(
			`moduleAActionEventListener:correlationId: ${JSON.stringify(reply.data.correlationId)}`
		);
		logger.info(`moduleAActionEventListener:data: ${JSON.stringify(reply.data.data)}`);

		const request = reply.data.data;

		const result: number = Number(request) ?? 0;

		logger.info(`moduleAActionEventListener:result: ${result}`);

		const replyMessage: ReplyMessageBullMq<string> = {
			correlationId: reply.data.correlationId,
			success: true,
			data: String(result),
			message: `A module compensate message received and processed successfully`,
		};
		return replyMessage;
	});

	worker.on('completed', (job) => {
		console.log(`[App - moduleAActionEventListener] Job completed: ${job.id}`);
	});

	worker.on('failed', (job, err) => {
		console.error(
			`[App - moduleAActionEventListener] Job failed: ${job.id}, Error: ${err.message}`
		);
	});
};
//#endregion
