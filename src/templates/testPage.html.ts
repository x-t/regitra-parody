/**
 * Copyright (C) zxyz 2023
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { allowedErrorCount } from "../exam";
import { strings } from "../i18n";
import { state } from "../lib/state";

export async function testPage(name: string, num: number, qs: string) {
  return `
  <div class="mainWindow">
      <div class="testTopBar">
        <div>${name}</div>
        <div>${await strings("test")} ${num}</div>
        <div>${state.examCategory.toUpperCase()} ${await strings(
          "testCategory",
        )} ${await strings("langCode")}</div>
      </div>
      
      ${qs}
      
      <div class="testControl">
        <div>
          <div><button id="examPreviousTask" disabled><img src="/img/taskPrev.png" alt="Prev" /><span>${await strings(
            "previousTask",
          )}</span></button></div>
          <div><button id="examNextTask"><span><strong>${await strings(
            "nextTask",
          )}</strong></span><img src="/img/taskNext.png" alt="Next" /></button></div>
        </div>
        <div><button id="finishTestAction"><img src="/img/finishTest.png" alt="Finish" /><span>${await strings(
          "finishTest",
        )}</span></button></div>
      </div>
      
      <div class="testQuestionInfo">
          <div class="testInfo">
            <div>
              <span id="currentQuestion"></span> ${(
                await strings("taskNum")
              ).replace("$$", state.numOfQuestions)}
            </div>
            <div>
              ${await strings("timeLeft")} <span id="countdownEnd"></span>
            </div>
          </div>
          
          <div class="questionControls">
            <div>
              ${(() => {
                let controls = "";
                for (let q in state.questionIDs) {
                  controls += `<div class="examTaskSelectorContainer"
                    data-questionNumber="${parseInt(q)}">
                    <button class="examTaskSelector">
                      <div data-answered="false" 
                        data-jumpId="${state.questionIDs[q]}">${
                          parseInt(q) + 1
                        }</div>
                    </button>
                    <div style="min-height:19.5px;">
                      <img alt="Current" src="/img/testRun.png" />
                    </div>
                  </div>`;
                  if (state.questionIDs.length > 30 && parseInt(q) + 1 === 30) {
                    controls += `<div class="examTaskSelectorSpacer"></div>`;
                  }
                }
                return controls;
              })()}
            </div>
        </div>
      </div>
  </div>
  <div class="confirmationOverlay"></div>
  <div id="overlayDialog">
    <div id="overlayDialogTitle" class="overlayDialogTitle">
      <button id="overlayCloseButton" type="button" class="overlayCloseButton" aria-label="Close"><img src="/img/cancel.png" alt="Close" /></button>
    </div>
    <div>
      <div class="overlayDialogContent">
        <img src="/img/question_big.png" alt="Question mark" />
        <p id="overlayConfirmationContent"></p>
      </div>
      <div class="overlayDialogContent2">
        <button id="finishTestConfirmation"><img src="/img/OKButton.png" alt="OK" />${await strings(
          "ok",
        )}</button> <span style="margin-right: 5px;"></span> <button id="cancelTestConfirmation"><img src="/img/cancelButton.png" alt="Cancel" />${await strings(
          "cancel",
        )}</button>
      </div>
    </div>
  </div>
  <div class="examFinishOverlay"></div>
  <div class="examFinishDialog">
    <div><p><span id="examResultPassMessage"></span></p></div>
    <div>
      <p>${await strings(
        "examRegistrationNumber",
      )} <span class="resultSpacer"></span> ${num}</p>
      <p>${await strings(
        "participant",
      )} <span class="resultSpacer"></span> ${name}</p>
      <p>${await strings(
        "category",
      )} <span class="resultSpacer"></span> ${state.examCategory.toUpperCase()}</p>
      <p>${await strings("givenAnswers")} <span class="resultSpacer"></span> ${
        state.numOfQuestions
      }</p>
      <p>${await strings(
        "correctAnswers",
      )} <span class="resultSpacer"></span> <span id="examResultCorrectAnswers"></span></p>
      <p>${await strings(
        "incorrectAnswers",
      )} <span class="resultSpacer"></span> <span id="examResultIncorrectAnswers"></span></p>
      <p>${await strings(
        "allowedErrors",
      )} <span class="resultSpacer"></span> ${allowedErrorCount}</p>
    </div>
    <div>
      <button id="examResultViewAnswers"><img src="/img/answers.png" alt="Chart" /> ${await strings(
        "viewAnswers",
      )}</button>
    </div>
  </div>
`;
}
