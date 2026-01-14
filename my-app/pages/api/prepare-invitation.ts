/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { randomUUID } from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';
import { getEventStore } from '../../app/src/registry';
import { ensureInitialized } from './initializer';
import { createPrepareInvitationCommandHandler } from '../../app/src/slices/SlicePrepareInvitation/PrepareInvitationCommandHandler';
import { PrepareInvitationCommand } from '../../app/src/slices/SlicePrepareInvitation/PrepareInvitationCommand';

ensureInitialized();

const ONE_STREAM_ONLY = 'ONE_STREAM_ONLY';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
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

    // ---- create command ----
    const command: PrepareInvitationCommand = {
      streamId: ONE_STREAM_ONLY,
      type: 'PrepareInvitation',
      data: {
        clientId: randomUUID(),
                    clientEmail: req.body.clientEmail,
                    entrepriseId: req.body.entrepriseId
      },
      metadata: {
        correlation_id: correlation_id,
        causation_id: correlation_id,
      },
    };

    // ---- call command handler ----
    const commandHandler = createPrepareInvitationCommandHandler(getEventStore());
    await commandHandler(command);

    // ---- async acknowledgement ----
    res.status(202).json({
      message: 'PrepareInvitation attempt recorded',
      correlationId: correlation_id,
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
