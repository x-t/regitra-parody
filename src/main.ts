/**
 * Copyright (C) zxyz 2023
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import "./regitra.css";
import { strings, changeLanguage } from "./i18n";
import { beginPage } from "./templates/beginPage.html";
import { beginExam } from "./exam";
import { state } from "./lib/state";
import "./keyboard";
import "./url";
import { changeCategory } from "./examControl";
import {
  get_language_list,
  get_category_arr,
  get_defaults_info,
} from "./importer";

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
      changeLanguage(lang);
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
  let defaults = get_defaults_info();
  let setCategory = localStorage.getItem("setCategory");
  let setLanguage = localStorage.getItem("setLanguage");
  if (!setCategory) changeCategory(defaults.c);
  else changeCategory(setCategory);
  if (!setLanguage) changeLanguage(defaults.l);
  else changeLanguage(setLanguage);

  app.innerHTML = await beginPage(examName);
  hydrateFront();
};
