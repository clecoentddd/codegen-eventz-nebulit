/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { randomUUID } from "crypto";
import { NextApiRequest, NextApiResponse } from "next";
import { getEventStore } from "../../app/src/registry";
import { ensureInitialized } from "./initializer";
import { createClientAuthentifieCommandHandler } from "../../app/src/slices/SliceClientAuthentificationAuth0/ClientAuthentifieCommandHandler";
import { ClientAuthentifieCommand } from "../../app/src/slices/SliceClientAuthentificationAuth0/ClientAuthentifieCommand";

ensureInitialized();

const ONE_STREAM_ONLY = "ONE_STREAM_ONLY";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const correlation_id =
      (req.headers["correlation_id"] as string) ?? req.body.id ?? randomUUID();

    const command: ClientAuthentifieCommand = {
      streamId: ONE_STREAM_ONLY,
      type: "ClientAuthentifie",
      data: {
        clientId: req.body.clientId,
        clientEmail: req.body.clientEmail,
        entrepriseId: req.body.entrepriseId,
      },
      metadata: {
        correlation_id,
        causation_id: correlation_id,
      },
    };

    const commandHandler = createClientAuthentifieCommandHandler(
      getEventStore(),
    );
    await commandHandler(command);

    res.status(202).json({
      message: "ClientAuthentifie attempt recorded",
      correlationId: correlation_id,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
