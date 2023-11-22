/**
 * Copyright (C) zxyz 2023
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { expect, test } from "vitest";
import { areArraysEqualSets } from "./array";

test("arrays should be equal sets", () => {
  let arr1 = [1, 2, 2, 3, 4];
  let arr2 = [2, 4, 3, 1];
  expect(areArraysEqualSets(arr1, arr2)).toBe(true);
});

test("arrays should not be equal sets", () => {
  let arr1 = [1, 2];
  let arr2 = [1];
  expect(areArraysEqualSets(arr1, arr2)).toBe(false);
});
