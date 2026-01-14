/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { NextApiRequest, NextApiResponse } from "next";
import { ensureInitialized } from "./initializer";
import { getAdminConnectionProjection } from "../../app/src/slices/SliceAdminConnecte/projectionAdminConnection";

ensureInitialized();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  try {
    const data = await getAdminConnectionProjection();
    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
