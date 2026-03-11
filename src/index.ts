/**
 * ocpp-smart-charge-engine — Public API
 *
 * Library-agnostic OCPP Smart Charging constraint solver.
 * Works with ocpp-ws-io, ocpp-rpc, raw WebSocket, or any OCPP implementation.
 */

// Core engine
export { SmartChargingEngine } from "./engine.js";

// Strategy constants for type-safe algorithm selection
export const Strategies = {
  EQUAL_SHARE: "EQUAL_SHARE",
  PRIORITY: "PRIORITY",
  TIME_OF_USE: "TIME_OF_USE",
} as const;

// Errors
export {
  SmartChargingConfigError,
  DuplicateSessionError,
  SessionNotFoundError,
  StrategyError,
} from "./errors.js";

// All types for users who want to extend or type their dispatcher
export type {
  // Core
  SmartChargingEngineConfig,
  SmartChargingEngineEvents,
  Strategy,
  // Session
  ChargingSession,
  ActiveSession,
  // Dispatch
  ChargingProfileDispatcher,
  DispatchPayload,
  DispatchErrorEvent,
  // Result
  SessionProfile,
  // OCPP Profile shapes
  OcppChargingProfile,
  OcppChargingSchedule,
  OcppChargingSchedulePeriod,
  // Time-of-Use
  TimeOfUseWindow,
  // Strategy internals (for custom strategies)
  StrategyFn,
} from "./types.js";
