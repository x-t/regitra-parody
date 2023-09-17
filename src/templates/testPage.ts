export const testPage = (
  strings: any,
  name: string,
  num: number,
  qs: string
) => `
  <div class="mainWindow">
      <div class="testTopBar">
        <div>${name}</div>
        <div>${strings.test} ${num}</div>
        <div>${strings.bCategory} ${strings.langCode}</div>
      </div>
      
      ${qs}
      
      <div class="testControl">
        <div>
          <div><button disabled><img src="/img/taskPrev.png" alt="Prev" /><span>${
            strings.previousTask
          }</span></button></div>
          <div><button><span><strong>${
            strings.nextTask
          }</strong></span><img src="/img/taskNext.png" alt="Next" /></button></div>
        </div>
        <div><button id="finishTestAction"><img src="/img/finishTest.png" alt="Finish" /><span>${
          strings.finishTest
        }</span></button></div>
      </div>
      
      <div class="testQuestionInfo">
          <div class="testInfo">
            <div>
              <span id="currentQuestion"></span> ${strings.taskNum}
            </div>
            <div>
              ${strings.timeLeft} <span id="countdownEnd"></span>
            </div>
          </div>
          
          <div class="questionControls">
            <div>
              ${
                (() => {
                  let controls = "";
                  for (let i = 1; i <= 30; i++) {
                    controls += `<div><button><div data-answered="false">${i}</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>`
                  }
                  return controls
                })()
              }
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
        <button id="finishTestConfirmation"><img src="/img/OKButton.png" alt="OK" />${
          strings.ok
        }</button> <span style="margin-right: 5px;"></span> <button id="cancelTestConfirmation"><img src="/img/cancelButton.png" alt="Cancel" />${
  strings.cancel
}</button>
      </div>
    </div>
  </div>
  <div class="examFinishOverlay"></div>
  <div class="examFinishDialog">
    <div><p><span id="__Res_Pass"></span></p></div>
    <div>
      <p>${
        strings.examRegistrationNumber
      } <span class="resultSpacer"></span> ${Math.floor(
  Math.random() * 10000 + 60000
)}</p>
      <p>${strings.participant} <span class="resultSpacer"></span> ${name}</p>
      <p>${strings.category} <span class="resultSpacer"></span> B</p>
      <p>${strings.givenAnswers} <span class="resultSpacer"></span> 30</p>
      <p>${
        strings.correctAnswers
      } <span class="resultSpacer"></span> <span id="__Res_CorrectAnswers"></span></p>
      <p>${
        strings.incorrectAnswers
      } <span class="resultSpacer"></span> <span id="__Res_IncorrectAnswers"></span></p>
      <p>${strings.allowedErrors} <span class="resultSpacer"></span> 6</p>
    </div>
    <div>
      <button id="__Res_ViewAnswersBtn"><img src="/img/answers.png" alt="Chart" /> ${
        strings.viewAnswers
      }</button>
    </div>
  </div>
`;