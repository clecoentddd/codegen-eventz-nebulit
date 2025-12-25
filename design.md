
# Eventz Architecture Design & Migration Plan

This document outlines the design for the "eventz" architecture and presents an incremental plan for its implementation. The goal is to build a full-stack, slice-based, event-sourced application using Next.js, leveraging and adapting templates from the existing `emmet` generator.

## 1. Eventz Architecture Overview

The proposed architecture is a classic CQRS and Event Sourcing pattern. It is designed to be modular (slice-based) and relies on an in-memory message bus for communication between components.

### Core Components:

1.  **API Routes**: Next.js API routes that serve as the entry point for commands (mutations) and queries (reads).
2.  **Mock Message Bus (`messageBus.ts`)**: A simple, in-memory, singleton pub/sub system that acts as our mock RabbitMQ for both commands and events.
3.  **Command Handler (`[slice]/commandHandler.ts`)**: Subscribes to specific command topics on the message bus, validates commands, and orchestrates the domain logic.
4.  **Judge (`[slice]/judge.ts`)**: Pure functions representing the core domain logic. A judge receives the current state and a command, and decides which event(s) to produce.
5.  **Event Store (`eventStore.ts`)**: A simple, append-only in-memory log for all events. It is the single source of truth for aggregate state.
6.  **Projection (`[slice]/projection.ts`)**: Subscribes to event topics on the message bus and builds/updates a denormalized read model.

### Data Flow:

**Command Flow (Write-Side):**
`HTTP POST Request -> Next.js API Route -> messageBus.publish(command) -> Command Handler -> judge(state, command) -> eventStore.append(event) -> messageBus.publish(event)`

**Query Flow (Read-Side):**
`Event -> Projection -> Read Model (In-memory DB) <- Next.js API Route <- HTTP GET Request`

---

## 2. Migration Plan: Adapting `emmet` Templates

The `emmet` generator, while using a different library, provides excellent templates that align with this architecture. We will adapt them as follows:

| Target Component | `emmet` Template to Adapt | Required Changes |
| :--- | :--- | :--- |
| **Command/Event Types** | `events.ts.tpl`, `commands.ts.tpl` | Minimal. These are primarily type definitions. |
| **The "Judge"** | Logic from `spec_state_change.ts.tpl` (`decide`, `evolve` funcs) | Extract the pattern of `(state, command) => event[]` into a dedicated `judge.ts` template. |
| **Command Handler** | New Template | Create a `commandHandler.ts.tpl` that subscribes to the `messageBus` and contains the core handler logic (get state, call judge, append, publish event). |
| **Projection** | `readmodel.ts.tpl` | Adapt to subscribe to events from the `messageBus` and update an in-memory store instead of a database. |
| **API Routes** | `commandApi.ts.tpl`, `readModelApi.ts.tpl` | **This is the `routes.js` equivalent.** We will adapt these to create Next.js API Routes under `pages/api/`. The command API will simply publish to the `messageBus`. The query API will read from the projection. |
| **Automated Processes**| `processor.ts.tpl` | This template will be used later for scheduled tasks (like the orchestrating todo-list example), which can trigger commands. |
| **BDD Tests** | `spec_given_when_then.ts.tpl` | Adapt to test our `judge.ts` functions directly, ensuring business logic is sound without needing the full API stack. |

---

## 3. Implementation Plan

The generator is being built incrementally. The current status and next steps are outlined below.

### **Phase 1: Core Backend Infrastructure (Complete)**

The `eventz` generator is now capable of scaffolding the entire write-side of a slice-based CQRS/ES application. This includes:
-   **Core Infrastructure**: Generating a `messageBus` for in-memory messaging and an `EventStore` (with a `SupabaseEventStore` implementation).
-   **Slice Scaffolding**: For a given feature (e.g., "Register Customer"), the generator creates:
    -   `Command` and `Event` type definitions.
    -   A `decider` function for the core business logic.
    -   A `commandHandler` to orchestrate the process.
    -   A `registry.ts` file to wire up all the handlers.

### **Phase 2: UI and Command API Generation (Next Steps)**

The next major step is to generate the front-end components and API routes necessary to interact with the command-side of the application.
1.  **Create Command API Route Template**:
    -   **Goal**: Generate a Next.js API route (e.g., `pages/api/command/[sliceName].ts`).
    -   **Function**: This route will receive an HTTP POST request, validate the payload, and publish the corresponding command to the `messageBus`.
2.  **Create UI Component Template**:
    -   **Goal**: Generate a React component (e.g., `components/slices/[sliceName]/[commandName].tsx`).
    -   **Function**: This component will render a form to capture user input for a specific command. On submission, it will send a POST request to the command API route.
3.  **Update Generator Logic**:
    -   Extend the Yeoman generator to include prompts for UI generation.
    -   Add file-writing logic for the new API route and UI component templates.
    -   Integrate the new components into a main application page (e.g., `pages/index.tsx`).

### **Phase 3: Projection and Query API Generation (Future)**

Once the command-side UI is complete, we will implement the read-side.
1.  **Create Projection Template**:
    -   **Goal**: Generate a `projection.ts` file within a slice directory.
    -   **Function**: This module will subscribe to events from the `messageBus` and build a denormalized read model (e.g., a simple in-memory list or a database table).
2.  **Create Query API Route Template**:
    -   **Goal**: Generate a Next.js API route for queries (e.g., `pages/api/query/[sliceName].ts`).
    -   **Function**: This route will fetch data directly from the corresponding projection and return it to the client.
3.  **Generate UI for Displaying Data**:
    -   Create components that fetch data from the query API and display it to the user (e.g., a table listing all customers).

This updated plan provides a clear roadmap for developing the `eventz` generator into a true full-stack scaffolding tool.
