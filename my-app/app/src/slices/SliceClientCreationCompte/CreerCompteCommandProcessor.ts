/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { EventStore } from '../../common/domain/EventStore';
import { rabbitMQMock } from '../../common/infrastructure/RabbitMQMock';
import { signalMock } from '../../common/infrastructure/SignalMock';
import { CreerCompteCommand } from './CreerCompteCommand';

const ONE_STREAM_ONLY = "ONE_STREAM_ONLY";

// Async command processor that subscribes to RabbitMQ
export const createCreerCompteCommandProcessor = (eventStore: EventStore) => {
    const processCommand = async (command: CreerCompteCommand) => {
        try {
            console.log(`[CreerCompteProcessor] Processing command: ${command.streamId}`);

            // Import the decider for business logic
            const { decide } = await import('./CreerCompteDecider');
            const newEvents = decide(command);

            // Append decision events
            await eventStore.appendEvents(ONE_STREAM_ONLY, newEvents);

            // Emit signals for each event
            for (const event of newEvents) {
                await signalMock.emit(event.type, event);
            }

            console.log(`[CreerCompteProcessor] Command processed successfully: ${command.streamId}`);
        } catch (error) {
            console.error(`[CreerCompteProcessor] Failed to process command: ${command.streamId}`, error);

            // TODO: Publish failure event
            // const failureEvent: CreerCompteFailed = { ... }
            // await eventStore.appendEvents(command.streamId, [failureEvent]);
            // await signalMock.emit('CreerCompteFailed', failureEvent);
        }
    };

    // Subscribe to RabbitMQ queue
    rabbitMQMock.subscribeToQueue('CreerCompte-queue', processCommand);

    return {
        unsubscribe: () => {
            rabbitMQMock.unsubscribeFromQueue('CreerCompte-queue', processCommand);
        }
    };
};
