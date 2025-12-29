/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { <%= commandType %>Command } from './<%= commandType %>Command';
<%- eventImports %>

const ONE_STREAM_ONLY = "ONE_STREAM_ONLY";

export type <%= commandType %>Events = <%= eventUnion %>;

export const decide = (command: <%= commandType %>Command): <%= commandType %>Events[] => {
    // Business logic to decide which events to emit based on the command
    return [
        <%= resultingEvents %>
    ];
};
