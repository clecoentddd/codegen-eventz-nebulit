/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { EventStore } from '../../common/domain/EventStore';
import { rabbitMQMock } from '../../common/infrastructure/RabbitMQMock';
import { signalMock } from '../../common/infrastructure/SignalMock';
import { AdminConnecteCommand } from './AdminConnecteCommand';
import { AdminConnecteAttempted, AdminConnecteAttemptedEventName } from '../../events/AdminConnecteAttempted';

export const createAdminConnecteCommandHandler = (eventStore: EventStore) => {
    return async (command: AdminConnecteCommand) => {
        // EventZ Pattern: Append "Attempted" event and publish to RabbitMQ for async processing

        // 1. Append Attempted event to event store
        const attemptedEvent: AdminConnecteAttempted = {
            streamId: command.streamId,
            type: AdminConnecteAttemptedEventName,
            data: {
                connectionId: command.data.connectionId,
                adminEmail: command.data.adminEmail
            },
            metadata: {
                correlation_id: command.metadata?.correlation_id,
                causation_id: command.metadata?.causation_id
            }
        };

        await eventStore.appendEvents(command.streamId, [attemptedEvent]);

        // 2. Emit signal for processors/projections to wake up
        await signalMock.emit('AdminConnecteAttempted', attemptedEvent);

        // 3. Publish to RabbitMQ for async command processing
        await rabbitMQMock.publishToTopic('AdminConnecte-queue', command);

        console.log(`[AdminConnecteHandler] Command attempted and queued for processing: ${command.streamId}`);
    };
};
