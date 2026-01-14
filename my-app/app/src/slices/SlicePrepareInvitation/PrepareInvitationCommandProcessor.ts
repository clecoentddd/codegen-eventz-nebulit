/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { EventStore } from '../../common/domain/EventStore';
import { rabbitMQMock } from '../../common/infrastructure/RabbitMQMock';
import { signalMock } from '../../common/infrastructure/SignalMock';
import { PrepareInvitationCommand } from './PrepareInvitationCommand';

const ONE_STREAM_ONLY = "ONE_STREAM_ONLY";

// Async command processor that subscribes to RabbitMQ
export const createPrepareInvitationCommandProcessor = (eventStore: EventStore) => {
    const processCommand = async (command: PrepareInvitationCommand) => {
        try {
            console.log(`[PrepareInvitationProcessor] Processing command: ${command.streamId}`);

            // Import the decider for business logic
            const { decide } = await import('./PrepareInvitationDecider');
            const newEvents = decide(command);

            // Append decision events
            await eventStore.appendEvents(ONE_STREAM_ONLY, newEvents);

            // Emit signals for each event
            for (const event of newEvents) {
                await signalMock.emit(event.type, event);
            }

            console.log(`[PrepareInvitationProcessor] Command processed successfully: ${command.streamId}`);
        } catch (error) {
            console.error(`[PrepareInvitationProcessor] Failed to process command: ${command.streamId}`, error);

            // TODO: Publish failure event
            // const failureEvent: PrepareInvitationFailed = { ... }
            // await eventStore.appendEvents(command.streamId, [failureEvent]);
            // await signalMock.emit('PrepareInvitationFailed', failureEvent);
        }
    };

    // Subscribe to RabbitMQ queue
    rabbitMQMock.subscribeToQueue('PrepareInvitation-queue', processCommand);

    return {
        unsubscribe: () => {
            rabbitMQMock.unsubscribeFromQueue('PrepareInvitation-queue', processCommand);
        }
    };
};
