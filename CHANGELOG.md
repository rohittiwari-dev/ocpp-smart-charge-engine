# ocpp-smart-charge-engine

## Changelog

### 0.1.0-alpha (2026-03-12)

Initial alpha release.

#### Features
- `SmartChargingEngine` — library-agnostic OCPP smart charging constraint solver
- Three built-in allocation strategies: `EQUAL_SHARE`, `PRIORITY`, `TIME_OF_USE`
- `addSession()` / `removeSession()` / `safeRemoveSession()` for session lifecycle management
- `optimize()` — pure calculation without dispatch
- `dispatch()` — calculate + call user dispatcher with per-session error isolation (`'dispatchError'` event)
- Runtime configuration: `setGridLimit()`, `setAlgorithm()`, `setSafetyMargin()`
- Typed events: `sessionAdded`, `sessionRemoved`, `optimized`, `dispatched`, `dispatchError`, `error`
- `OcppChargingProfile` compatible with OCPP 1.6 and 2.0.1
- CJS + ESM dual build
- Full vitest test suite
