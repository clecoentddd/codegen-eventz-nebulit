/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { EventStore } from '../../common/domain/EventStore';
import { rabbitMQMock } from '../../common/infrastructure/RabbitMQMock';
import { signalMock } from '../../common/infrastructure/SignalMock';
import { PrepareInvitationCommand } from './PrepareInvitationCommand';
import { PrepareInvitationAttempted, PrepareInvitationAttemptedEventName } from '../../events/PrepareInvitationAttempted';

export const createPrepareInvitationCommandHandler = (eventStore: EventStore) => {
    return async (command: PrepareInvitationCommand) => {
        // EventZ Pattern: Append "Attempted" event and publish to RabbitMQ for async processing

        // 1. Append Attempted event to event store
        const attemptedEvent: PrepareInvitationAttempted = {
            streamId: command.streamId,
            type: PrepareInvitationAttemptedEventName,
            data: {
                clientId: command.data.clientId,
                clientEmail: command.data.clientEmail,
                entrepriseId: command.data.entrepriseId
            },
            metadata: {
                correlation_id: command.metadata?.correlation_id,
                causation_id: command.metadata?.causation_id
            }
        };

        await eventStore.appendEvents(command.streamId, [attemptedEvent]);

        // 2. Emit signal for processors/projections to wake up
        await signalMock.emit('PrepareInvitationAttempted', attemptedEvent);

        // 3. Publish to RabbitMQ for async command processing
        await rabbitMQMock.publishToTopic('PrepareInvitation-queue', command);

        console.log(`[PrepareInvitationHandler] Command attempted and queued for processing: ${command.streamId}`);
    };
};
