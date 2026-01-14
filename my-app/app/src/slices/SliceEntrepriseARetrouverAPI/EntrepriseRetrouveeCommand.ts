/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */


import { Command } from '../../common/domain/Command';

export type EntrepriseRetrouveeCommandPayload = {
    entrepriseId: string;
    entrepriseNom: string;
    connectionId: string;
};

export type EntrepriseRetrouveeCommand = Command<EntrepriseRetrouveeCommandPayload>;

