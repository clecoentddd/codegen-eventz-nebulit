/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { Command } from '../../common/domain/Command';

<%= commandPayload %>

export type <%= commandType %>Command = Command<'<%= commandType %>', <%= commandType %>CommandPayload>;
