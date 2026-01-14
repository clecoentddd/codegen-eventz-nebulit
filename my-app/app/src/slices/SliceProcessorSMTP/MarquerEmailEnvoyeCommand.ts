/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */


import { Command } from '../../common/domain/Command';

export type MarquerEmailEnvoyeCommandPayload = {
    clientId: string;
    clientEmail: string;
    entrepriseId: string;
};

export type MarquerEmailEnvoyeCommand = Command<MarquerEmailEnvoyeCommandPayload>;

