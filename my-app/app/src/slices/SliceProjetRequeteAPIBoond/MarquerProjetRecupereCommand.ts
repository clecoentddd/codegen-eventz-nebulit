/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */


import { Command } from '../../common/domain/Command';

export type MarquerProjetRecupereCommandPayload = {
    projetId: string;
    entrepriseId: string;
    projetNom: string;
};

export type MarquerProjetRecupereCommand = Command<MarquerProjetRecupereCommandPayload>;

