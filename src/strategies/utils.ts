import type { ActiveSession, SessionProfile } from "../types.js";

/**
 * Shared helper used by all strategies to build a SessionProfile
 * from an ActiveSession and an allocated kW figure.
 * Also normalises the value to 2 decimal places.
 */
export function buildSessionProfile(
  session: ActiveSession,
  allocatedKw: number,
): SessionProfile {
  const kw = Math.max(0, parseFloat(allocatedKw.toFixed(2)));
  const watts = parseFloat((kw * 1000).toFixed(2));
  // Amps per phase: P(W) = V * I * phases  →  I = P / (V * phases)
  // Default European voltage 230V, phases from session
  const voltage = 230;
  const ampsPerPhase = parseFloat(
    (watts / (voltage * session.phases)).toFixed(2),
  );

  return {
    transactionId: session.transactionId,
    clientId: session.clientId,
    connectorId: session.connectorId,
    allocatedKw: kw,
    allocatedW: watts,
    allocatedAmpsPerPhase: ampsPerPhase,
  };
}
