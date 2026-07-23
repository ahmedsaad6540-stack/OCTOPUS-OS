# Developer Onboarding Guide

Welcome to the OCTOPUS OS Phase 2 project! This guide will help you get your local development environment up and running.

## Workspace Bootstrap

We use `pnpm` as our package manager and `turbo` for monorepo tasks.

1. **Install Dependencies**
   Run the following command at the root of the project:
   ```bash
   pnpm install
   ```

2. **Run Typecheck**
   Ensure all TypeScript types are correct across all 35+ packages:
   ```bash
   pnpm -r run typecheck
   ```

3. **Run Tests**
   Run the test suite across all packages:
   ```bash
   pnpm -r run test
   ```

## Adding a New Adapter

To add a new affiliate network adapter to `@workspace/network-adapters`:

1. Navigate to `lib/network-adapters/src/adapters/`.
2. Create a new file (e.g., `new-network.ts`) implementing the `AffiliateNetworkAdapter` interface.
3. Export your new adapter from `lib/network-adapters/src/index.ts`.
4. Register it within the `AdapterRegistry` (if applicable) or where the adapters are initialized in `ProfitEngine`.

## Adding a New Business Policy

To add a new policy to `@workspace/business-policy`:

1. Navigate to `lib/business-policy/src/policies/`.
2. Create a new file implementing the `BusinessPolicy` interface.
3. Define the `evaluate(context)` method to return a strict pass/fail decision.
4. Export the policy and ensure it is loaded by the `PolicyEngine` during initialization.

## Testing Strategy

- **Unit Tests**: Place `*.test.ts` files adjacent to the code they test. Use the built-in `node:test` runner.
- **Integration Tests**: Place cross-package tests in a dedicated integration test folder (or within `api-server` tests).
- **LEARNING Simulations**: Use the Profit Engine's `LEARNING` mode to test strategies. In this mode, actions are evaluated and logged, but no real money is spent or real external actions executed. This acts as a paper-trading sandbox.
