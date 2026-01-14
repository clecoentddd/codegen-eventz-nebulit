/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */
import jwt from "jsonwebtoken";

import { signalMock } from "../../common/infrastructure/SignalMock";
import { getFactureARecupererTodoProjection } from "./projectionFactureARecupererTodo";

import { MarquerFactureRecupereeCommand } from "./MarquerFactureRecupereeCommand";
import { createMarquerFactureRecupereeCommandHandler } from "./MarquerFactureRecupereeCommandHandler";
import { getEventStore } from "../../registry";

const ONE_STREAM_ONLY = "ONE_STREAM_ONLY";
const CUSTOMER_INVOICE_STATUS_SENT = 1;

type BoondInvoice = Record<string, any>;

export interface TodoProcessorConfig {
  queueName: string;
  maxRetries: number;
  batchSize: number;
}

const config: TodoProcessorConfig = {
  queueName: "FactureARecupererTodo-todo-queue",
  maxRetries: 3,
  batchSize: 10,
};

function getEnvConfig() {
  const baseUrl = process.env.BOOND_BASE_URL || "https://ui.boondmanager.com";
  const defaultKeywords = process.env.BOOND_INVOICE_KEYWORDS || "";
  const defaultStates =
    process.env.BOOND_INVOICE_STATES || `${CUSTOMER_INVOICE_STATUS_SENT}`;

  return {
    baseUrl,
    defaultKeywords,
    defaultStates,
  };
}

function getClientToken() {
  if (process.env.BOOND_JWT_TOKEN) {
    return process.env.BOOND_JWT_TOKEN;
  }

  const payload = {
    userToken: process.env.BOOND_USER_TOKEN,
    clientToken: process.env.BOOND_CLIENT_TOKEN,
    time: new Date(),
    mode: "normal",
  };
  const secretKey = process.env.BOOND_CLIENT_KEY;
  if (!payload.userToken || !payload.clientToken) {
    throw new Error(
      "BOOND_USER_TOKEN and BOOND_CLIENT_TOKEN are required to sign the Boond token.",
    );
  }
  if (!secretKey) {
    throw new Error(
      "BOOND_CLIENT_KEY is required to sign the Boond token (or set BOOND_JWT_TOKEN).",
    );
  }
  return jwt.sign(payload, secretKey);
}

function pickValue(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number") return String(value);
  return undefined;
}

function pickInvoiceId(invoice: BoondInvoice): string | undefined {
  return (
    pickValue(invoice.id) ||
    pickValue(invoice.invoiceId) ||
    pickValue(invoice.invoice_id) ||
    pickValue(invoice.code) ||
    pickValue(invoice.reference) ||
    pickValue(invoice.ref)
  );
}

function pickProjectId(invoice: BoondInvoice): string | undefined {
  return (
    pickValue(invoice.projectId) ||
    pickValue(invoice.project_id) ||
    pickValue(invoice.projetId) ||
    pickValue(invoice.project?.id) ||
    pickValue(invoice.project?.uuid)
  );
}

function pickEntrepriseId(invoice: BoondInvoice): string | undefined {
  return (
    pickValue(invoice.customerId) ||
    pickValue(invoice.customer_id) ||
    pickValue(invoice.companyId) ||
    pickValue(invoice.company_id) ||
    pickValue(invoice.clientId) ||
    pickValue(invoice.customer?.id) ||
    pickValue(invoice.company?.id)
  );
}

async function fetchInvoices(states: string, keywords: string) {
  const { baseUrl } = getEnvConfig();
  const token = getClientToken();
  const url = new URL("/api/invoices/", baseUrl);

  if (states) {
    url.searchParams.set("states", states);
  }
  if (keywords) {
    url.searchParams.set("keywords", keywords);
  }

  console.log(
    `[Boond] Fetching invoices: ${url.toString()} (states=${states || "none"}, keywords=${keywords || "none"})`,
  );

  const response = await fetch(url.toString(), {
    headers: {
      "X-Jwt-Client-BoondManager": token,
      "X-Jwt-Client": token,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `Boond API responded with ${response.status} ${response.statusText}: ${errorBody}`,
    );
  }

  const payload = await response.json();
  return (payload?.data ?? []) as BoondInvoice[];
}

export class FactureARecupererTodoProcessor {
  private processing: boolean = false;

  constructor() {
    // No constructor parameters needed for signal-based processing
  }

  async start(): Promise<void> {
    console.log(`Starting FactureARecupererTodo Todo Processor...`);

    // Subscribe to signals for event-driven processing
    signalMock.subscribe("ClientAuthentifie", async (event: any) => {
      console.log(`[Processor] Received event: ${event.type}`);
      await this.processPendingTodos();
    });

    // Initial processing on startup
    await this.processPendingTodos();
  }

  private async processPendingTodos(): Promise<void> {
    if (this.processing) {
      console.log("[Processor] Already running, skipping...");
      return;
    }

    this.processing = true;

    try {
      const eventStore = getEventStore();
      const pendingTodos = await getFactureARecupererTodoProjection(eventStore);

      if (pendingTodos.length === 0) {
        console.log("[Processor] No pending todos to process");
        return;
      }

      console.log(
        `[Processor] Processing ${pendingTodos.length} pending todos...`,
      );

      // Process todos in batches
      for (let i = 0; i < pendingTodos.length; i += config.batchSize) {
        const batch = pendingTodos.slice(i, i + config.batchSize);
        await this.processBatch(batch);
      }
    } catch (error) {
      console.error("[Processor] Error processing todos:", error);
    } finally {
      this.processing = false;
    }
  }

  private async processBatch(todos: any[]): Promise<void> {
    for (const todo of todos) {
      try {
        await this.processTodo(todo);
      } catch (error) {
        console.error(`[Processor] Failed to process todo ${todo.id}:`, error);
        await this.handleProcessingError(todo, error);
      }
    }
  }

  private async processTodo(todo: any): Promise<void> {
    // Idempotent processing - check if already processed
    if (todo.status === "processing") {
      console.log(
        `[Processor] Todo ${todo.id} already being processed, skipping...`,
      );
      return;
    }

    console.log(`[Processor] Processing todo: ${JSON.stringify(todo)}`);

    const { defaultKeywords, defaultStates } = getEnvConfig();
    const keywords = String(
      todo.keywords || todo.factureId || defaultKeywords || "",
    ).trim();
    const states = String(todo.states || defaultStates || "").trim();
    const invoices = await fetchInvoices(states, keywords);

    if (invoices.length === 0) {
      console.log("[Processor] No invoices returned by Boond API.");
      return;
    }

    const eventStore = getEventStore();
    const handler = createMarquerFactureRecupereeCommandHandler(eventStore);

    for (const invoice of invoices) {
      const factureId = pickInvoiceId(invoice);
      const projetId = pickProjectId(invoice);
      const entrepriseId = pickEntrepriseId(invoice) ?? todo.entrepriseId ?? "";

      if (!factureId || !projetId) {
        console.warn("[Processor] Skipping invoice with missing ids", invoice);
        continue;
      }

      const command: MarquerFactureRecupereeCommand = {
        streamId: ONE_STREAM_ONLY,
        type: "MarquerFactureRecuperee",
        data: {
          factureId,
          projetId,
          entrepriseId,
        },
        metadata: {
          correlation_id: todo.correlationId,
          causation_id: todo.id,
        },
      };

      await handler(command);
    }

    console.log(
      `[Processor] Successfully dispatched invoices for todo ${todo.id}`,
    );
  }

  private async handleProcessingError(todo: any, error: any): Promise<void> {
    const retryCount = (todo.retryCount || 0) + 1;

    if (retryCount >= config.maxRetries) {
      console.error(
        `[Processor] Todo ${todo.id} failed permanently after ${retryCount} retries`,
      );
      // TODO: Publish failure message to dead letter queue
    } else {
      console.log(
        `[Processor] Todo ${todo.id} failed, will retry (${retryCount}/${config.maxRetries})`,
      );
      // TODO: Publish retry message with delay
    }
  }

  async stop(): Promise<void> {
    console.log(`Stopping FactureARecupererTodo Todo Processor...`);
    this.processing = false;
  }
}

// Factory function
export function createFactureARecupererTodoProcessor(): FactureARecupererTodoProcessor {
  return new FactureARecupererTodoProcessor();
}
