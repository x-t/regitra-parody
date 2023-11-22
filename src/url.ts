/**
 * Copyright (C) zxyz 2023
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { state } from "./lib/state";
import { changeCategory } from "./examControl";

const urlParams = new URLSearchParams(window.location.search);

if (urlParams.get("experiments") === "true") {
  if (urlParams.get("exposeState") === "true") {
    // @ts-ignore
    window.state = state;
  }
}

const lang = urlParams.get("lang");
if (lang) {
  state.selectedLanguage = lang;
}

const category = urlParams.get("category");
if (category) {
  changeCategory(category);
}
