/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { messageBus } from '../../app/src/common/infrastructure/messageBus';
import { <%= commandType %>Command } from '<%= commandPath %>';
import { ensureInitialized } from './initializer';

ensureInitialized();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== '<%= httpMethod %>') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const command: <%= commandType %>Command = {
            streamId: req.body.streamId, // Or generate a new one
            type: '<%= commandType %>',
            data: {
                <%= commandPayload %>
            },
            metadata: {
                correlation_id: req.headers['x-correlation-id'] as string,
                causation_id: req.headers['x-causation-id'] as string,
            }
        };

        await messageBus.publish('<%= commandType %>', command);

        res.status(202).json({ message: 'Command accepted.' });

    } catch (error) {
        console.error('Error processing command:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
