/**
 * Copyright (C) zxyz 2023
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { strings } from "../i18n";
import { state } from "../lib/state";
import { get_category_arr } from "../importer";


const categories = get_category_arr();

export async function beginPage(name: string, language: string) {
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
            <select name="examCategory" id="selectExamCategory">
            ${(() => {
              let concat = "";
              for (let c in categories) {
                concat += `
                <option 
                  value="${categories[c]}"
                  ${state.examCategory === categories[c] ? "selected" : ""}>
                  ${categories[c].toUpperCase()}
                </option>
                `;
              }
              return concat;
            })()}
            </select>
          </td>
        </tr>
        <tr>
          <td>${await strings("testLang")}</td>
          <td>
            <button id="changeLangLT"><img id="changeLangLTImg" src="${
              language === "lt" ? "/img/LTyes.png" : "/img/LToff.png"
            }" alt="LT"></button>
            <button id="changeLangEN"><img id="changeLangENImg" src="${
              language === "en" ? "/img/ENyes.png" : "/img/ENoff.png"
            }" alt="EN"></button>
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
    <p class="infoSmall">©️ <a href="https://x-t.github.io">x-t</a> ${new Date().getFullYear()} <a href="https://github.com/x-t/regitra-parody/blob/main/LICENSE">MPL-2.0</a></p>
  </div>
  <div class="examFinishOverlay"></div>
`;
}
