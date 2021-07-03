export const beginPage = (strings: any, name: string, language: string) => `
  <div class="mainWindow">
    <div class="head">
      <span class="beginHeader">${strings[language].beginHeader}</span>
    </div>

    <div class="name">
      <span class="beginName">${name}</span>
    </div>

    <div class="options">
      <table>
        <tr>
          <td>${strings[language].category}</td>
          <td>B</td>
        </tr>
        <tr>
          <td>${strings[language].testLang}</td>
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
      <span>${
        strings[language].startExam
      }</span><img src="/img/arrow.png" height="32" width="32" alt="Arrow"/>
    </button>
  </div>
  <div class="examFinishOverlay"></div>
`;

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
              <div><button><div data-answered="false">1</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">2</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">3</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">4</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">5</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">6</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">7</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">8</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">9</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">10</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">11</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">12</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">13</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">14</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">15</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">16</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">17</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">18</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">19</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">20</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">21</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">22</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">23</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">24</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">25</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">26</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">27</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">28</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">29</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
              <div><button><div data-answered="false">30</div></button><div><img alt="Current" src="/img/testRun.png" /></div></div>
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
