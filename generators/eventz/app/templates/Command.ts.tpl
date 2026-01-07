/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

<% if (typeof command !== 'undefined' && command) { %>
import { Command } from '../../common/domain/Command';

export type <%= commandType %>CommandPayload = {
<%_ command.fields.forEach(function(field) { _%>
    <%= field.name %>: <%= tsType(field) %>;
<%_ }); _%>
};

export type <%= commandType %>Command = Command<<%= commandType %>CommandPayload>;
<% } else { %>
export type Command<T = any> = {
    streamId: string;
    id: string;
    type: string;
    data: T;
    metadata?: {
        correlation_id?: string;
        causation_id?: string;
    };
};
<% } %>
