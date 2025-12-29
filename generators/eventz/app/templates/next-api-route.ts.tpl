/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { randomUUID } from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';
import { rabbitMQMock } from '../../app/src/common/infrastructure/RabbitMQMock';
import { getEventStore } from '../../app/src/registry';
import { ensureInitialized } from './initializer';

ensureInitialized();

const ONE_STREAM_ONLY = 'ONE_STREAM_ONLY';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== '<%= httpMethod %>') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // ---- correlation ----
    const correlation_id =
      (req.headers['correlation_id'] as string) ??
      req.body.id ??
      randomUUID();

    // ---- identity (if needed by the slice) ----
    const id = randomUUID();

    // ---- Eventz fact: Attempted ----
    const attemptedEvent = {
      id: randomUUID(),
      streamId: ONE_STREAM_ONLY,
      type: '<%= commandType %>Attempted',
      data: {
        <%= attemptedEventPayload %>
      },
      metadata: {
        correlation_id: correlation_id,
        causation_id: correlation_id,
      },
    };

    // ---- append to source of truth ----
    await getEventStore().appendEvents(ONE_STREAM_ONLY, [attemptedEvent]);

    // ---- publish THE SAME fact for async processing ----
    await rabbitMQMock.publishToTopic(
      '<%= commandType %>-queue',
      attemptedEvent
    );

    // ---- async acknowledgement ----
    res.status(202).json({
      message: '<%= commandType %> attempt recorded',
      correlationId: correlation_id,
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
