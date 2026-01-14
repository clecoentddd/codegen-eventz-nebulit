/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { EventStore } from '../../common/domain/EventStore';
import { rabbitMQMock } from '../../common/infrastructure/RabbitMQMock';
import { signalMock } from '../../common/infrastructure/SignalMock';
import { MarquerFactureRecupereeCommand } from './MarquerFactureRecupereeCommand';

const ONE_STREAM_ONLY = "ONE_STREAM_ONLY";

// Async command processor that subscribes to RabbitMQ
export const createMarquerFactureRecupereeCommandProcessor = (eventStore: EventStore) => {
    const processCommand = async (command: MarquerFactureRecupereeCommand) => {
        try {
            console.log(`[MarquerFactureRecupereeProcessor] Processing command: ${command.streamId}`);

            // Import the decider for business logic
            const { decide } = await import('./MarquerFactureRecupereeDecider');
            const newEvents = decide(command);

            // Append decision events
            await eventStore.appendEvents(ONE_STREAM_ONLY, newEvents);

            // Emit signals for each event
            for (const event of newEvents) {
                await signalMock.emit(event.type, event);
            }

            console.log(`[MarquerFactureRecupereeProcessor] Command processed successfully: ${command.streamId}`);
        } catch (error) {
            console.error(`[MarquerFactureRecupereeProcessor] Failed to process command: ${command.streamId}`, error);

            // TODO: Publish failure event
            // const failureEvent: MarquerFactureRecupereeFailed = { ... }
            // await eventStore.appendEvents(command.streamId, [failureEvent]);
            // await signalMock.emit('MarquerFactureRecupereeFailed', failureEvent);
        }
    };

    // Subscribe to RabbitMQ queue
    rabbitMQMock.subscribeToQueue('MarquerFactureRecuperee-queue', processCommand);

    return {
        unsubscribe: () => {
            rabbitMQMock.unsubscribeFromQueue('MarquerFactureRecuperee-queue', processCommand);
        }
    };
};
