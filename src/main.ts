/**
 * Copyright (C) zxyz 2023
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import "./regitra.css";
import { strings } from "./i18n";
import { beginPage } from "./templates/beginPage.html";
import { beginExam } from "./exam";
import { state } from "./lib/state";
import "./keyboard";
import "./url";
import { changeCategory } from "./examControl";
import { get_language_list, get_category_arr } from "./importer";

export const app = document.querySelector<HTMLDivElement>("#app")!;
export const examName = "DEMO NAUDOTOJAS";

async function hydrateFront() {
  document.querySelector<HTMLSpanElement>("#globalLoadingBoxText")!.innerHTML =
    await strings("wait");

  const langs = get_language_list();
  const categories = get_category_arr();

  langs.forEach((lang) => {
    document.querySelector<HTMLButtonElement>(
      `#changeLang${lang.toUpperCase()}`,
    )!.onclick = async () => {
      if (state.selectedLanguage === lang) return;
      state.selectedLanguage = lang;
      document.querySelector("html")?.setAttribute("lang", lang);
      app.innerHTML = await beginPage(examName);
      hydrateFront();
    };
  });

  categories.forEach((category) => {
    document.querySelector<HTMLButtonElement>(
      `#changeCategory${category.toUpperCase()}`,
    )!.onclick = async () => {
      if (state.examCategory === category) return;
      changeCategory(category);
      app.innerHTML = await beginPage(examName);
      hydrateFront();
    };
  });

  document.querySelector<HTMLButtonElement>(".beginButton")!.onclick =
    beginExam;
}

window.onload = async function () {
  app.innerHTML = await beginPage(examName);
  hydrateFront();
};
