<p align="center">
  <strong>ocpp-smart-charge-engine</strong>
</p>

<p align="center">
Library-agnostic OCPP smart charging constraint solver for EV charge point operators.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/ocpp-smart-charge-engine">
    <img src="https://img.shields.io/npm/v/ocpp-smart-charge-engine.svg?style=flat-square&color=cb3837" alt="npm version" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License: MIT" />
  </a>
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=flat-square&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0%2B-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

---

## What is this?

`ocpp-smart-charge-engine` solves one problem: **how to distribute your site's grid power fairly and safely among EV chargers** using OCPP's `SetChargingProfile` command.

It is **completely library-agnostic**. It does not care whether you use `ocpp-ws-io`, `ocpp-rpc`, raw WebSockets, or any other OCPP implementation. You supply a `dispatcher` callback, and the engine calls it with the computed charging profile — what you do inside the callback is entirely up to you.

> **Note on Charger Compatibility**
> `SetChargingProfile` is part of the OCPP 1.6 Smart Charging optional feature profile and is mandatory in OCPP 2.0.1. If a charger rejects the command (e.g., older hardware without Smart Charging support), your dispatcher should catch the error. The engine handles this gracefully — it emits a `'dispatchError'` event for the failing session and **continues dispatching to all other sessions**.

---

## Install

```bash
npm install ocpp-smart-charge-engine
```

---

## Quick Start

```typescript
import { SmartChargingEngine, Strategies } from 'ocpp-smart-charge-engine';

const engine = new SmartChargingEngine({
  siteId: 'SITE-HQ-001',
  maxGridPowerKw: 100,         // 100kW grid connection
  safetyMarginPct: 5,          // Use max 95kW, leave 5% buffer
  algorithm: Strategies.EQUAL_SHARE,

  // The ONLY integration point — use whatever OCPP library you have
  dispatcher: async ({ clientId, connectorId, chargingProfile }) => {
    // ✅ ocpp-ws-io
    await server.safeSendToClient(clientId, 'ocpp1.6', 'SetChargingProfile', {
      connectorId,
      csChargingProfiles: chargingProfile,
    });
  },
});

// When a car connects (from your OCPP StartTransaction handler)
engine.addSession({
  transactionId: payload.transactionId,
  clientId: client.identity,
  connectorId: payload.connectorId,
  maxHardwarePowerKw: 22,     // Charger max hardware rating
});

// Recalculate and dispatch profiles to all active chargers
await engine.dispatch();

// When a car leaves
engine.removeSession(payload.transactionId);
await engine.dispatch(); // Redistribute power to remaining sessions
```

---

## Library-Agnostic Dispatcher Examples

### With `ocpp-ws-io`
```typescript
dispatcher: async ({ clientId, connectorId, chargingProfile }) => {
  await server.safeSendToClient(
    clientId,
    'ocpp1.6',
    'SetChargingProfile',
    { connectorId, csChargingProfiles: chargingProfile },
    { idempotencyKey: `profile-${chargingProfile.transactionId}` }
  );
}
```

### With `ocpp-rpc`
```typescript
dispatcher: async ({ clientId, connectorId, chargingProfile }) => {
  const client = connectionMap.get(clientId);
  await client?.call('SetChargingProfile', {
    connectorId,
    csChargingProfiles: chargingProfile,
  });
}
```

### With raw WebSocket
```typescript
dispatcher: async ({ clientId, connectorId, chargingProfile }) => {
  const ws = wsMap.get(clientId);
  ws?.send(JSON.stringify([2, crypto.randomUUID(), 'SetChargingProfile', {
    connectorId,
    csChargingProfiles: chargingProfile,
  }]));
}
```

---

## Strategies

### `EQUAL_SHARE` (default)
Divides available grid power equally among all active sessions. Each session is additionally capped by `maxHardwarePowerKw` and `maxEvAcceptancePowerKw`.

```typescript
// 3 cars, 100kW grid, 5% margin = 95kW effective
// Each car gets: 95 / 3 = 31.67 kW
```

### `PRIORITY`
Allocates power proportionally to each session's `priority` value (higher number = more power).

```typescript
engine.addSession({ transactionId: 1, clientId: 'CP-001', priority: 8 }); // → 80kW
engine.addSession({ transactionId: 2, clientId: 'CP-002', priority: 2 }); // → 20kW
// Total: 100kW
```

### `TIME_OF_USE`
Reduces grid usage during configured peak pricing windows.

```typescript
const engine = new SmartChargingEngine({
  algorithm: Strategies.TIME_OF_USE,
  timeOfUseWindows: [
    { peakStartHour: 18, peakEndHour: 22, peakPowerMultiplier: 0.5 }, // 50% during 6–10pm
  ],
  // ...
});
// At 7pm: effectiveGrid = 100 * 0.5 = 50kW, divided equally
// At 2pm: effectiveGrid = 100kW, divided equally
```

---

## API Reference

### `new SmartChargingEngine(config)`

| Option | Type | Default | Description |
|---|---|---|---|
| `siteId` | `string` | required | Human-readable site identifier |
| `maxGridPowerKw` | `number` | required | Maximum site grid power in kW |
| `dispatcher` | `ChargingProfileDispatcher` | required | Your OCPP send function |
| `algorithm` | `Strategy` | `EQUAL_SHARE` | Allocation strategy |
| `safetyMarginPct` | `number` | `5` | Power held in reserve (%) |
| `phases` | `1 \| 3` | `3` | AC phase count for the site |
| `voltageV` | `number` | `230` | Grid voltage for amps calculation |
| `timeOfUseWindows` | `TimeOfUseWindow[]` | `[]` | Peak windows (TIME_OF_USE only) |
| `debug` | `boolean` | `false` | Enable verbose console logging |

### Methods

| Method | Description |
|---|---|
| `addSession(session)` | Register a session. Throws `DuplicateSessionError` if already exists |
| `removeSession(txId)` | Remove a session. Throws `SessionNotFoundError` if not found |
| `safeRemoveSession(txId)` | Remove without throwing — returns `undefined` if not found |
| `optimize()` | Calculate profiles **without** dispatching. Returns `SessionProfile[]` |
| `dispatch()` | Calculate profiles **and** call dispatcher for each. Returns `Promise<SessionProfile[]>` |
| `setGridLimit(kw)` | Update grid limit at runtime |
| `setAlgorithm(strategy)` | Hot-swap algorithm at runtime |
| `setSafetyMargin(pct)` | Update safety margin at runtime |
| `getSessions()` | Read-only array of active sessions |
| `isEmpty()` | Returns `true` when no sessions are registered |

### Events

| Event | Payload | Fired when |
|---|---|---|
| `sessionAdded` | `ActiveSession` | A session is registered |
| `sessionRemoved` | `ActiveSession` | A session is removed |
| `optimized` | `SessionProfile[]` | After `optimize()` completes |
| `dispatched` | `SessionProfile[]` | After all dispatcher calls settle |
| `dispatchError` | `DispatchErrorEvent` | A dispatcher call throws; engine continues |
| `error` | `Error` | A strategy function throws |

---

## License

MIT © 2026 Rohit Tiwari
