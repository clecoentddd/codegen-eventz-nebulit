/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { EventStore } from '../../common/domain/EventStore';
import { rabbitMQMock } from '../../common/infrastructure/RabbitMQMock';
import { signalMock } from '../../common/infrastructure/SignalMock';
import { <%= commandType %>Command } from './<%= commandType %>Command';

const ONE_STREAM_ONLY = "ONE_STREAM_ONLY";

// Async command processor that subscribes to RabbitMQ
export const create<%= commandType %>CommandProcessor = (eventStore: EventStore) => {
    const processCommand = async (command: <%= commandType %>Command) => {
        try {
            console.log(`[<%= commandType %>Processor] Processing command: ${command.streamId}`);

            // Import the decider for business logic
            const { decide } = await import('./<%= commandType %>Decider');
            const newEvents = decide(command);

            // Append decision events
            await eventStore.appendEvents(ONE_STREAM_ONLY, newEvents);

            // Emit signals for each event
            for (const event of newEvents) {
                await signalMock.emit(event.type, event);
            }

            console.log(`[<%= commandType %>Processor] Command processed successfully: ${command.streamId}`);
        } catch (error) {
            console.error(`[<%= commandType %>Processor] Failed to process command: ${command.streamId}`, error);

            // TODO: Publish failure event
            // const failureEvent: <%= commandType %>Failed = { ... }
            // await eventStore.appendEvents(command.streamId, [failureEvent]);
            // await signalMock.emit('<%= commandType %>Failed', failureEvent);
        }
    };

    // Subscribe to RabbitMQ queue
    rabbitMQMock.subscribeToQueue('<%= commandType %>-queue', processCommand);

    return {
        unsubscribe: () => {
            rabbitMQMock.unsubscribeFromQueue('<%= commandType %>-queue', processCommand);
        }
    };
};
