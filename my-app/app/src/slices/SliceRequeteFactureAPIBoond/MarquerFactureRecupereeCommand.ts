/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */


import { Command } from '../../common/domain/Command';

export type MarquerFactureRecupereeCommandPayload = {
    factureId: string;
    projetId: string;
    entrepriseId: string;
};

export type MarquerFactureRecupereeCommand = Command<MarquerFactureRecupereeCommandPayload>;

