/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { EventStore } from '../../common/domain/EventStore';
import { rabbitMQMock } from '../../common/infrastructure/RabbitMQMock';
import { signalMock } from '../../common/infrastructure/SignalMock';
import { MarquerEmailEnvoyeCommand } from './MarquerEmailEnvoyeCommand';

const ONE_STREAM_ONLY = "ONE_STREAM_ONLY";

// Async command processor that subscribes to RabbitMQ
export const createMarquerEmailEnvoyeCommandProcessor = (eventStore: EventStore) => {
    const processCommand = async (command: MarquerEmailEnvoyeCommand) => {
        try {
            console.log(`[MarquerEmailEnvoyeProcessor] Processing command: ${command.streamId}`);

            // Import the decider for business logic
            const { decide } = await import('./MarquerEmailEnvoyeDecider');
            const newEvents = decide(command);

            // Append decision events
            await eventStore.appendEvents(ONE_STREAM_ONLY, newEvents);

            // Emit signals for each event
            for (const event of newEvents) {
                await signalMock.emit(event.type, event);
            }

            console.log(`[MarquerEmailEnvoyeProcessor] Command processed successfully: ${command.streamId}`);
        } catch (error) {
            console.error(`[MarquerEmailEnvoyeProcessor] Failed to process command: ${command.streamId}`, error);

            // TODO: Publish failure event
            // const failureEvent: MarquerEmailEnvoyeFailed = { ... }
            // await eventStore.appendEvents(command.streamId, [failureEvent]);
            // await signalMock.emit('MarquerEmailEnvoyeFailed', failureEvent);
        }
    };

    // Subscribe to RabbitMQ queue
    rabbitMQMock.subscribeToQueue('MarquerEmailEnvoye-queue', processCommand);

    return {
        unsubscribe: () => {
            rabbitMQMock.unsubscribeFromQueue('MarquerEmailEnvoye-queue', processCommand);
        }
    };
};
