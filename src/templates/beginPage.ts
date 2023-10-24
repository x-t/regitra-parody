import { strings } from "../i18n";
import { state } from "../lib/state";

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
          <td>${state.examCategory.toUpperCase()}</td>
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
    <p style="color:gray;font-size:0.8em;">${await strings("affiliationWarning")}</p>
  </div>
  <div class="examFinishOverlay"></div>
`;
}
