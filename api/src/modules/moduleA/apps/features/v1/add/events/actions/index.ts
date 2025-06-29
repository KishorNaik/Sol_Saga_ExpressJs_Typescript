import { logger } from '@/shared/utils/helpers/loggers';
import {
	bullMqRedisConnection,
	JsonString,
	ReplyMessageBullMq,
	RequestReplyConsumerBullMq,
} from '@kishornaik/utils';
import { ARequestDto, AResponseDto } from '../../contracts';

const queueName = `moduleA-action-queue`;
const consumer = new RequestReplyConsumerBullMq(bullMqRedisConnection);

//#region Event Listener
export const moduleAActionEventListener = async () => {
	const worker = await consumer.startConsumingAsync<JsonString, JsonString>(
		queueName,
		async (reply) => {
			logger.info(
				`moduleAActionEventListener:correlationId: ${JSON.stringify(reply.data.correlationId)}`
			);
			logger.info(`moduleAActionEventListener:data: ${JSON.stringify(reply.data.data)}`);

			const requestDto: ARequestDto = JSON.parse(reply.data.data);

			const result: number = requestDto.value1 + requestDto.value2;

			logger.info(`moduleAActionEventListener:result: ${result}`);

			const response: AResponseDto = new AResponseDto();
			response.result = result;

			const responseJson: JsonString = JSON.stringify(response) as JsonString;

			const replyMessage: ReplyMessageBullMq<JsonString> = {
				correlationId: reply.data.correlationId,
				success: true,
				data: responseJson,
				message: `A module action message received and processed successfully`,
			};
			return replyMessage;
		}
	);

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
