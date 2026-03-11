/**
 * Version-specific ChargingProfile builder helpers.
 *
 * The engine produces library-agnostic `SessionProfile` objects (raw kW/W/A numbers).
 * Use these builders in your dispatcher to convert them into the correct
 * OCPP version-specific `SetChargingProfile` payload.
 *
 * OCPP Charging Profile differences by version:
 *   - 1.6:   `chargingProfileId`, `ChargePointMaxProfile`, single `chargingSchedule` object
 *   - 2.0.1: `id`, `ChargingStationMaxProfile`, `chargingSchedule` is an ARRAY,
 *             transactionId is a string, new `salesTariff` and `powerTolerance` fields
 *   - 2.1:   extends 2.0.1 with ISO 15118-20 V2G discharge profiles
 */

import type { SessionProfile } from "./types.js";

// ─────────────────────────────────────────────────────────────────────────────
// OCPP 1.6 ChargingProfile
// ─────────────────────────────────────────────────────────────────────────────

export interface Ocpp16ChargingProfile {
  chargingProfileId: number;
  transactionId?: number;
  stackLevel: number;
  chargingProfilePurpose:
    | "ChargePointMaxProfile"
    | "TxDefaultProfile"
    | "TxProfile";
  chargingProfileKind: "Absolute" | "Recurring" | "Relative";
  recurrencyKind?: "Daily" | "Weekly";
  validFrom?: string;
  validTo?: string;
  chargingSchedule: Ocpp16ChargingSchedule;
}

export interface Ocpp16ChargingSchedule {
  duration?: number;
  startSchedule?: string;
  chargingRateUnit: "W" | "A";
  chargingSchedulePeriod: Ocpp16ChargingSchedulePeriod[];
  minChargingRate?: number;
}

export interface Ocpp16ChargingSchedulePeriod {
  startPeriod: number;
  limit: number;
  numberPhases?: 1 | 2 | 3;
}

/** Options for the OCPP 1.6 profile builder */
export interface Ocpp16ProfileOptions {
  profileId?: number;
  stackLevel?: number;
  purpose?: Ocpp16ChargingProfile["chargingProfilePurpose"];
  /** Rate unit — defaults to 'W' */
  rateUnit?: "W" | "A";
  numberPhases?: 1 | 2 | 3;
}

/**
 * Build an OCPP **1.6** `CsChargingProfiles` object from a `SessionProfile`.
 *
 * Pass the result as `csChargingProfiles` inside `SetChargingProfile`.
 *
 * @example
 * ```typescript
 * dispatcher: async ({ clientId, connectorId, sessionProfile }) => {
 *   const profile = buildOcpp16Profile(sessionProfile);
 *   await server.safeSendToClient(clientId, 'ocpp1.6', 'SetChargingProfile', {
 *     connectorId,
 *     csChargingProfiles: profile,
 *   });
 * }
 * ```
 */
let ocpp16IdCounter = 1;

export function buildOcpp16Profile(
  sessionProfile: SessionProfile,
  options: Ocpp16ProfileOptions = {},
): Ocpp16ChargingProfile {
  const rateUnit = options.rateUnit ?? "W";
  const limit =
    rateUnit === "W"
      ? sessionProfile.allocatedW
      : sessionProfile.allocatedAmpsPerPhase;

  return {
    chargingProfileId: options.profileId ?? ocpp16IdCounter++,
    ...(typeof sessionProfile.transactionId === "number"
      ? { transactionId: sessionProfile.transactionId }
      : {}),
    stackLevel: options.stackLevel ?? 0,
    chargingProfilePurpose: options.purpose ?? "TxProfile",
    chargingProfileKind: "Absolute",
    chargingSchedule: {
      chargingRateUnit: rateUnit,
      chargingSchedulePeriod: [
        {
          startPeriod: 0,
          limit,
          numberPhases: options.numberPhases ?? 3,
        },
      ],
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// OCPP 2.0.1 ChargingProfile
// ─────────────────────────────────────────────────────────────────────────────

export interface Ocpp201ChargingProfile {
  /** In 2.0.1 this is `id` (not `chargingProfileId`) */
  id: number;
  transactionId?: string; // string in 2.0.1 (not integer like 1.6)
  stackLevel: number;
  chargingProfilePurpose:
    | "ChargingStationExternalConstraints"   // replaces ChargePointMaxProfile
    | "ChargingStationMaxProfile"
    | "TxDefaultProfile"
    | "TxProfile";
  chargingProfileKind: "Absolute" | "Recurring" | "Relative";
  recurrencyKind?: "Daily" | "Weekly";
  validFrom?: string;
  validTo?: string;
  /** In 2.0.1+, chargingSchedule is an ARRAY (supports multiple tariff tiers) */
  chargingSchedule: Ocpp201ChargingSchedule[];
}

export interface Ocpp201ChargingSchedule {
  id: number;
  startSchedule?: string;
  duration?: number;
  chargingRateUnit: "W" | "A";
  chargingSchedulePeriod: Ocpp201ChargingSchedulePeriod[];
  minChargingRate?: number;
  /** Optional: power tolerance ±% around the limit */
  powerTolerance?: number;
}

export interface Ocpp201ChargingSchedulePeriod {
  startPeriod: number;
  limit: number;
  /** Phase count. Defaults to 3. */
  numberPhases?: 1 | 2 | 3;
  /** Which phase to use for single-phase charging. L1=1, L2=2, L3=3 */
  phaseToUse?: 1 | 2 | 3;
}

/** Options for the OCPP 2.0.1 profile builder */
export interface Ocpp201ProfileOptions {
  profileId?: number;
  stackLevel?: number;
  purpose?: Ocpp201ChargingProfile["chargingProfilePurpose"];
  rateUnit?: "W" | "A";
  numberPhases?: 1 | 2 | 3;
}

/**
 * Build an OCPP **2.0.1 / 2.1** `ChargingProfile` object from a `SessionProfile`.
 *
 * Pass the result as `chargingProfile` inside `SetChargingProfile`.
 * The `evseId` in OCPP 2.0.1 replaces `connectorId` from 1.6.
 *
 * @example
 * ```typescript
 * dispatcher: async ({ clientId, connectorId, sessionProfile }) => {
 *   const profile = buildOcpp201Profile(sessionProfile);
 *   await server.safeSendToClient(clientId, 'ocpp2.0.1', 'SetChargingProfile', {
 *     evseId: connectorId,   // connectorId becomes evseId in 2.0.1
 *     chargingProfile: profile,
 *   });
 * }
 * ```
 */
let ocpp201IdCounter = 1;

export function buildOcpp201Profile(
  sessionProfile: SessionProfile,
  options: Ocpp201ProfileOptions = {},
): Ocpp201ChargingProfile {
  const rateUnit = options.rateUnit ?? "W";
  const limit =
    rateUnit === "W"
      ? sessionProfile.allocatedW
      : sessionProfile.allocatedAmpsPerPhase;

  return {
    id: options.profileId ?? ocpp201IdCounter++,
    // 2.0.1 transactionId is always a string
    transactionId: String(sessionProfile.transactionId),
    stackLevel: options.stackLevel ?? 0,
    chargingProfilePurpose: options.purpose ?? "TxProfile",
    chargingProfileKind: "Absolute",
    // KEY DIFFERENCE: chargingSchedule is an ARRAY in 2.0.1
    chargingSchedule: [
      {
        id: 1,
        chargingRateUnit: rateUnit,
        chargingSchedulePeriod: [
          {
            startPeriod: 0,
            limit,
            numberPhases: options.numberPhases ?? 3,
          },
        ],
      },
    ],
  };
}
