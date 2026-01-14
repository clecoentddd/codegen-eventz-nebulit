/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

import { NextApiRequest, NextApiResponse } from "next";
import { ensureInitialized } from "./initializer";
import { getListeDesEntreprisesDepuisBoondProjection } from "../../app/src/slices/SliceListeDesEntreprises/projectionListeDesEntreprisesDepuisBoond";

ensureInitialized();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  try {
    const data = await getListeDesEntreprisesDepuisBoondProjection();
    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
