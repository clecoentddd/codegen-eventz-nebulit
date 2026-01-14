/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { EventStore } from '../../common/domain/EventStore';
import { rabbitMQMock } from '../../common/infrastructure/RabbitMQMock';
import { signalMock } from '../../common/infrastructure/SignalMock';
import { ClientAuthentifieCommand } from './ClientAuthentifieCommand';

const ONE_STREAM_ONLY = "ONE_STREAM_ONLY";

// Async command processor that subscribes to RabbitMQ
export const createClientAuthentifieCommandProcessor = (eventStore: EventStore) => {
    const processCommand = async (command: ClientAuthentifieCommand) => {
        try {
            console.log(`[ClientAuthentifieProcessor] Processing command: ${command.streamId}`);

            // Import the decider for business logic
            const { decide } = await import('./ClientAuthentifieDecider');
            const newEvents = decide(command);

            // Append decision events
            await eventStore.appendEvents(ONE_STREAM_ONLY, newEvents);

            // Emit signals for each event
            for (const event of newEvents) {
                await signalMock.emit(event.type, event);
            }

            console.log(`[ClientAuthentifieProcessor] Command processed successfully: ${command.streamId}`);
        } catch (error) {
            console.error(`[ClientAuthentifieProcessor] Failed to process command: ${command.streamId}`, error);

            // TODO: Publish failure event
            // const failureEvent: ClientAuthentifieFailed = { ... }
            // await eventStore.appendEvents(command.streamId, [failureEvent]);
            // await signalMock.emit('ClientAuthentifieFailed', failureEvent);
        }
    };

    // Subscribe to RabbitMQ queue
    rabbitMQMock.subscribeToQueue('ClientAuthentifie-queue', processCommand);

    return {
        unsubscribe: () => {
            rabbitMQMock.unsubscribeFromQueue('ClientAuthentifie-queue', processCommand);
        }
    };
};
