/**
 * Copyright (C) zxyz 2023
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { state } from "./state";

export function countdownTimer(date: Date, hookEnds: () => void) {
  return () => {
    const difference = +date - +new Date();
    let remaining = "END";

    if (difference > 0) {
      const parts = {
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
      remaining = `00:${
        parts.minutes < 10 ? "0" + parts.minutes : parts.minutes
      }:${parts.seconds < 10 ? "0" + parts.seconds : parts.seconds}`;
    }

    if (state.examFinished === false) {
      if (remaining === "END") {
        hookEnds();
        return;
      }

      document.getElementById("countdownEnd")!.innerHTML = remaining;
    }
  };
}
