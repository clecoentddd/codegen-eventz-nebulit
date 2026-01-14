/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { EventStore } from '../../common/domain/EventStore';
import { rabbitMQMock } from '../../common/infrastructure/RabbitMQMock';
import { signalMock } from '../../common/infrastructure/SignalMock';
import { AdminConnecteCommand } from './AdminConnecteCommand';

const ONE_STREAM_ONLY = "ONE_STREAM_ONLY";

// Async command processor that subscribes to RabbitMQ
export const createAdminConnecteCommandProcessor = (eventStore: EventStore) => {
    const processCommand = async (command: AdminConnecteCommand) => {
        try {
            console.log(`[AdminConnecteProcessor] Processing command: ${command.streamId}`);

            // Import the decider for business logic
            const { decide } = await import('./AdminConnecteDecider');
            const newEvents = decide(command);

            // Append decision events
            await eventStore.appendEvents(ONE_STREAM_ONLY, newEvents);

            // Emit signals for each event
            for (const event of newEvents) {
                await signalMock.emit(event.type, event);
            }

            console.log(`[AdminConnecteProcessor] Command processed successfully: ${command.streamId}`);
        } catch (error) {
            console.error(`[AdminConnecteProcessor] Failed to process command: ${command.streamId}`, error);

            // TODO: Publish failure event
            // const failureEvent: AdminConnecteFailed = { ... }
            // await eventStore.appendEvents(command.streamId, [failureEvent]);
            // await signalMock.emit('AdminConnecteFailed', failureEvent);
        }
    };

    // Subscribe to RabbitMQ queue
    rabbitMQMock.subscribeToQueue('AdminConnecte-queue', processCommand);

    return {
        unsubscribe: () => {
            rabbitMQMock.unsubscribeFromQueue('AdminConnecte-queue', processCommand);
        }
    };
};
