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
          <div><button disabled><img src="/img/taskPrev.png" alt="Prev" /><span>${await strings(
            "previousTask",
          )}</span></button></div>
          <div><button><span><strong>${await strings(
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
                for (let i = 1; i <= state.numOfQuestions; i++) {
                  controls += `<div><button><div data-answered="false">${i}</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>`;
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
    <div><p><span id="__Res_Pass"></span></p></div>
    <div>
      <p>${await strings(
        "examRegistrationNumber",
      )} <span class="resultSpacer"></span> ${Math.floor(
        Math.random() * 10000 + 60000,
      )}</p>
      <p>${await strings(
        "participant",
      )} <span class="resultSpacer"></span> ${name}</p>
      <p>${await strings("category")} <span class="resultSpacer"></span> B</p>
      <p>${await strings("givenAnswers")} <span class="resultSpacer"></span> ${
        state.numOfQuestions
      }</p>
      <p>${await strings(
        "correctAnswers",
      )} <span class="resultSpacer"></span> <span id="__Res_CorrectAnswers"></span></p>
      <p>${await strings(
        "incorrectAnswers",
      )} <span class="resultSpacer"></span> <span id="__Res_IncorrectAnswers"></span></p>
      <p>${await strings(
        "allowedErrors",
      )} <span class="resultSpacer"></span> ${allowedErrorCount}</p>
    </div>
    <div>
      <button id="__Res_ViewAnswersBtn"><img src="/img/answers.png" alt="Chart" /> ${await strings(
        "viewAnswers",
      )}</button>
    </div>
  </div>
`;
}
