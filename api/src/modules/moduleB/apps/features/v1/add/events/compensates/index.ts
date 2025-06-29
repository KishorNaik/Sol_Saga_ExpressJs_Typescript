import { logger } from '@/shared/utils/helpers/loggers';
import {
	bullMqRedisConnection,
	JsonString,
	ReplyMessageBullMq,
	RequestReplyConsumerBullMq,
} from '@kishornaik/utils';

const queueName = `moduleB-compensate-queue`;
const consumer = new RequestReplyConsumerBullMq(bullMqRedisConnection);

//#region Event Listener
export const moduleBCompensateEventListener = async () => {
	const worker = await consumer.startConsumingAsync<string, string>(queueName, async (reply) => {
		logger.info(
			`moduleBActionEventListener:correlationId: ${JSON.stringify(reply.data.correlationId)}`
		);
		logger.info(`moduleBActionEventListener:data: ${JSON.stringify(reply.data.data)}`);

		const request = reply.data.data;

		const result: number = Number(request) ?? 0;

		logger.info(`moduleAActionEventListener:result: ${result}`);

		const replyMessage: ReplyMessageBullMq<string> = {
			correlationId: reply.data.correlationId,
			success: true,
			data: String(result),
			message: `B module compensate message received and processed successfully`,
		};
		return replyMessage;
	});

	worker.on('completed', (job) => {
		console.log(`[App - moduleBActionEventListener] Job completed: ${job.id}`);
	});

	worker.on('failed', (job, err) => {
		console.error(
			`[App - moduleBActionEventListener] Job failed: ${job.id}, Error: ${err.message}`
		);
	});
};
//#endregion
