/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as approvals from "../approvals.js";
import type * as authHelpers from "../authHelpers.js";
import type * as contractPdf from "../contractPdf.js";
import type * as contractVersions from "../contractVersions.js";
import type * as contracts from "../contracts.js";
import type * as groups from "../groups.js";
import type * as http from "../http.js";
import type * as lib_approvalRules from "../lib/approvalRules.js";
import type * as lib_validators from "../lib/validators.js";
import type * as members from "../members.js";
import type * as nonces from "../nonces.js";
import type * as pools from "../pools.js";
import type * as seed from "../seed.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  approvals: typeof approvals;
  authHelpers: typeof authHelpers;
  contractPdf: typeof contractPdf;
  contractVersions: typeof contractVersions;
  contracts: typeof contracts;
  groups: typeof groups;
  http: typeof http;
  "lib/approvalRules": typeof lib_approvalRules;
  "lib/validators": typeof lib_validators;
  members: typeof members;
  nonces: typeof nonces;
  pools: typeof pools;
  seed: typeof seed;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
