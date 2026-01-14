/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { EventStore } from '../../common/domain/EventStore';
import { rabbitMQMock } from '../../common/infrastructure/RabbitMQMock';
import { signalMock } from '../../common/infrastructure/SignalMock';
import { EntrepriseRetrouveeCommand } from './EntrepriseRetrouveeCommand';

const ONE_STREAM_ONLY = "ONE_STREAM_ONLY";

// Async command processor that subscribes to RabbitMQ
export const createEntrepriseRetrouveeCommandProcessor = (eventStore: EventStore) => {
    const processCommand = async (command: EntrepriseRetrouveeCommand) => {
        try {
            console.log(`[EntrepriseRetrouveeProcessor] Processing command: ${command.streamId}`);

            // Import the decider for business logic
            const { decide } = await import('./EntrepriseRetrouveeDecider');
            const newEvents = decide(command);

            // Append decision events
            await eventStore.appendEvents(ONE_STREAM_ONLY, newEvents);

            // Emit signals for each event
            for (const event of newEvents) {
                await signalMock.emit(event.type, event);
            }

            console.log(`[EntrepriseRetrouveeProcessor] Command processed successfully: ${command.streamId}`);
        } catch (error) {
            console.error(`[EntrepriseRetrouveeProcessor] Failed to process command: ${command.streamId}`, error);

            // TODO: Publish failure event
            // const failureEvent: EntrepriseRetrouveeFailed = { ... }
            // await eventStore.appendEvents(command.streamId, [failureEvent]);
            // await signalMock.emit('EntrepriseRetrouveeFailed', failureEvent);
        }
    };

    // Subscribe to RabbitMQ queue
    rabbitMQMock.subscribeToQueue('EntrepriseRetrouvee-queue', processCommand);

    return {
        unsubscribe: () => {
            rabbitMQMock.unsubscribeFromQueue('EntrepriseRetrouvee-queue', processCommand);
        }
    };
};
