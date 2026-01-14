/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { EventStore } from '../../common/domain/EventStore';
import { rabbitMQMock } from '../../common/infrastructure/RabbitMQMock';
import { signalMock } from '../../common/infrastructure/SignalMock';
import { MarquerProjetRecupereCommand } from './MarquerProjetRecupereCommand';

const ONE_STREAM_ONLY = "ONE_STREAM_ONLY";

// Async command processor that subscribes to RabbitMQ
export const createMarquerProjetRecupereCommandProcessor = (eventStore: EventStore) => {
    const processCommand = async (command: MarquerProjetRecupereCommand) => {
        try {
            console.log(`[MarquerProjetRecupereProcessor] Processing command: ${command.streamId}`);

            // Import the decider for business logic
            const { decide } = await import('./MarquerProjetRecupereDecider');
            const newEvents = decide(command);

            // Append decision events
            await eventStore.appendEvents(ONE_STREAM_ONLY, newEvents);

            // Emit signals for each event
            for (const event of newEvents) {
                await signalMock.emit(event.type, event);
            }

            console.log(`[MarquerProjetRecupereProcessor] Command processed successfully: ${command.streamId}`);
        } catch (error) {
            console.error(`[MarquerProjetRecupereProcessor] Failed to process command: ${command.streamId}`, error);

            // TODO: Publish failure event
            // const failureEvent: MarquerProjetRecupereFailed = { ... }
            // await eventStore.appendEvents(command.streamId, [failureEvent]);
            // await signalMock.emit('MarquerProjetRecupereFailed', failureEvent);
        }
    };

    // Subscribe to RabbitMQ queue
    rabbitMQMock.subscribeToQueue('MarquerProjetRecupere-queue', processCommand);

    return {
        unsubscribe: () => {
            rabbitMQMock.unsubscribeFromQueue('MarquerProjetRecupere-queue', processCommand);
        }
    };
};
