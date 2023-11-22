/**
 * Copyright (C) zxyz 2023
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { changeWithOffset } from "./examControl";
import { state } from "./lib/state";

window.addEventListener("keydown", function (event) {
  if (state.currentPage === "exam") {
    switch (event.key) {
      case "ArrowLeft":
        changeWithOffset(-1)();
        break;
      case "ArrowRight":
        changeWithOffset(1)();
        break;
    }
  }
});
