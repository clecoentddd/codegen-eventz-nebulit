/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */


import { Command } from '../../common/domain/Command';

export type AdminConnecteCommandPayload = {
    connectionId: string;
    adminEmail: string;
};

export type AdminConnecteCommand = Command<AdminConnecteCommandPayload>;

