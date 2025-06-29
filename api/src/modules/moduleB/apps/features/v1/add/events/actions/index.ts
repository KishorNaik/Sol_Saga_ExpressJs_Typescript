import { logger } from '@/shared/utils/helpers/loggers';
import {
	bullMqRedisConnection,
	JsonString,
	ReplyMessageBullMq,
	RequestReplyConsumerBullMq,
} from '@kishornaik/utils';
import { BRequestDto, BResponseDto } from '../../contracts';

const queueName = `moduleB-action-queue`;
const consumer = new RequestReplyConsumerBullMq(bullMqRedisConnection);

//#region Event Listener
export const moduleBActionEventListener = async () => {
	const worker = await consumer.startConsumingAsync<JsonString, JsonString>(
		queueName,
		async (reply) => {
			logger.info(
				`moduleBActionEventListener:correlationId: ${JSON.stringify(reply.data.correlationId)}`
			);
			logger.info(`moduleBActionEventListener:data: ${JSON.stringify(reply.data.data)}`);

			const requestDto: BRequestDto = JSON.parse(reply.data.data);

			const result: number = requestDto.value1 + requestDto.value2;

			logger.info(`moduleBActionEventListener:result: ${result}`);

			const response: BResponseDto = new BResponseDto();
			response.result = result;

			const responseJson: JsonString = JSON.stringify(response) as JsonString;

			const replyMessage: ReplyMessageBullMq<JsonString> = {
				correlationId: reply.data.correlationId,
				success: true,
				data: responseJson,
				message: `B module action message received and processed successfully`,
			};
			return replyMessage;
		}
	);

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
