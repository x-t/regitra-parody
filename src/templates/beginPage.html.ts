/**
 * Copyright (C) zxyz 2023
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { strings } from "../i18n";
import { state } from "../lib/state";
import {
  get_category_arr,
  get_version_info,
  get_language_list,
} from "../importer";

const categories = get_category_arr();
const version = get_version_info().version;
const languages = get_language_list();

export async function beginPage(name: string) {
  return `
  <div class="mainWindow">
    <div class="head">
      <span class="beginHeader">${await strings("beginHeader")}</span>
    </div>

    <div class="name">
      <span class="beginName">${name}</span>
    </div>

    <div class="options">
      <table>
        <tr>
          <td>${await strings("category")}</td>
          <td>
            ${(() => {
              let concat = "";
              for (let c of categories) {
                concat += `
                <button class="changeCategoryButton" id="changeCategory${c.toUpperCase()}">
                <img width=32 height=32 
                style="background:url(/img/category_${c}.svg) center no-repeat;"
                src="/img/${c == state.examCategory ? "checkmark" : "blank"}Overlay.png"
                alt="${c.toUpperCase()} category ${c == state.examCategory ? "selected" : ""}">
                </button>
                `;
              }
              return concat;
            })()}
          </td>
        </tr>
        <tr>
          <td>${await strings("testLang")}</td>
          <td>
            ${(() => {
              let language_list = "";
              for (let language of languages) {
                language_list += `
                  <button class="changeLangButton" id="changeLang${language.toUpperCase()}">
                  <img id="changeLang${language.toUpperCase()}Img" 
                  src="/img/${language.toUpperCase()}${language == state.selectedLanguage ? "yes" : "off"}.png" 
                  alt="${language.toUpperCase()} ${language == state.selectedLanguage ? "selected" : ""}"></button>`;
              }
              return language_list;
            })()}
          </td>
        </tr>
      </table>
    </div>

    <button class="beginButton">
      <span>${await strings(
        "startExam",
      )}</span><img src="/img/arrow.png" height="32" width="32" alt="Arrow"/>
    </button>
    <p class="infoSmall">${await strings("affiliationWarning")}</p>
    <p class="infoSmall"><a href="https://github.com/x-t/regitra-parody">v${version}</a> ©️ <a href="https://x-t.github.io">x-t</a> ${new Date().getFullYear()}</p>
  </div>
  <div class="examFinishOverlay"></div>
`;
}
