import { areArraysEqualSets } from "./array";
import { get_answer_data } from "./importer";
import { getLanguage, strings } from "./i18n";
import { selectQuestion, changeWithOffset } from "./examControl";
import { get_question_data } from "./importer";
import { generateQuestions } from "./generator";
import { testPage } from "./templates/testPage";
import { countdownTimer } from "./countdown";
import { app, examName } from "./main";
// @ts-ignore
import Draggable from "draggable_dialog";
import { state } from "./state";

export interface Question {
  id: number;
  q: string;
  image?: string;
  answers: string[];
}

interface AnswerT {
  id: number;
  correct: number[];
}

export async function beginExam() {
  const testRandNumber = Math.floor(Math.random() * 3000 + 9000);

  document.querySelector<HTMLDivElement>("#__Loading_Box")!.style.display =
    "flex";
  document.querySelector<HTMLDivElement>(".examFinishOverlay")!.style.display =
    "unset";

  let questions: Question[];
  try {
    questions = await get_question_data(getLanguage());
  } catch {
    alert(await strings("errorStart"));
    return;
  }

  app.innerHTML = await testPage(
    examName,
    testRandNumber,
    await generateQuestions(questions),
  );

  const endsDate = new Date(new Date().getTime() + 30 * 60000);

  document.querySelector<HTMLButtonElement>(
    ".testControl > div:nth-child(1) > div:nth-child(2) > button",
  )!.onclick = changeWithOffset(1);
  document.querySelector<HTMLButtonElement>(
    ".testControl > div:nth-child(1) > div:nth-child(1) > button",
  )!.onclick = changeWithOffset(-1);

  document
    .querySelectorAll<HTMLButtonElement>(
      ".questionControls > div > div > button",
    )
    .forEach((v, idx) => {
      v.onclick = () => {
        selectQuestion(idx + 1);
      };
    });

  // Safari-only styling, as additional default Webkit margins remove the need for 5px margin-left
  if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
    document
      .querySelectorAll<HTMLDivElement>(
        ".questionControls > div > div > button > div",
      )
      .forEach((d) => {
        d.style.marginLeft = "unset";
      });
  }

  questions.forEach((q, idxx) => {
    q.answers.forEach((_, idx) => {
      document.querySelector<HTMLButtonElement>(
        `#answer-${idxx}-${idx + 1}`,
      )!.onclick = () => {
        document
          .querySelector<HTMLDivElement>(
            `div[data-answerIndex="${idxx}-${idx + 1}"] > div.checkbox`,
          )!
          .setAttribute(
            "data-checked",
            document
              .querySelector<HTMLDivElement>(
                `div[data-answerIndex="${idxx}-${idx + 1}"] > div.checkbox`,
              )!
              .getAttribute("data-checked") === "true"
              ? "false"
              : "true",
          );
        if (
          document.querySelectorAll(
            `div[data-qIdx="${idxx}"] > div:nth-child(2) > button > div > div.checkbox[data-checked="true"]`,
          ).length != 0
        ) {
          document
            .querySelectorAll(`.questionControls > div > div > button > div`)!
            [idxx].setAttribute("data-answered", "true");
        } else {
          document
            .querySelectorAll(`.questionControls > div > div > button > div`)!
            [idxx].setAttribute("data-answered", "false");
        }
        let selectedAnswers = state.selectedAnswers
          ? state.selectedAnswers
          : {};

        if (!selectedAnswers[q.id]) selectedAnswers[q.id] = [];
        const yai = selectedAnswers[q.id].indexOf(idx + 1);
        if (yai > -1) {
          selectedAnswers[q.id].splice(yai, 1);
          if (selectedAnswers[q.id].length === 0) delete selectedAnswers[q.id];
        } else {
          selectedAnswers[q.id].push(idx + 1);
        }
        state.selectedAnswers = selectedAnswers;
      };
    });
  });

  const qIDs = questions.reduce<number[]>((acc, cur) => {
    acc.push(cur.id);
    return acc;
  }, []);
  state.questionIDs = qIDs;

  new Draggable({
    dialogId: "overlayDialog",
    elementThatCaptureTheClick: "overlayDialogTitle",
    centerElement: true,
    hideButtonId: "overlayCloseButton",
    showButtonId: "finishTestAction",
  });

  document
    .querySelector<HTMLButtonElement>("#finishTestAction")!
    .addEventListener("click", async () => {
      document.querySelector<HTMLParagraphElement>(
        "#overlayConfirmationContent",
      )!.innerHTML =
        document.querySelectorAll<HTMLDivElement>('div[data-answered="false"]')
          .length === 0
          ? await strings("confirmFinish")
          : await strings("warningUnanswered");
      document.querySelector<HTMLDivElement>(
        ".confirmationOverlay",
      )!.style.display = "unset";
    });

  document
    .querySelector<HTMLButtonElement>("#overlayCloseButton")!
    .addEventListener("click", () => {
      document.querySelector<HTMLDivElement>(
        ".confirmationOverlay",
      )!.style.display = "none";
    });

  document
    .querySelector<HTMLButtonElement>("#cancelTestConfirmation")!
    .addEventListener("click", () => {
      document.querySelector<HTMLButtonElement>("#overlayCloseButton")!.click();
    });

  document
    .querySelector<HTMLButtonElement>("#finishTestConfirmation")!
    .addEventListener("click", () => {
      document.querySelector<HTMLButtonElement>("#overlayCloseButton")!.click();
      finishExam();
    });

  document
    .querySelector<HTMLButtonElement>("#__Res_ViewAnswersBtn")!
    .addEventListener("click", () => {
      document.querySelector<HTMLDivElement>(
        ".examFinishOverlay",
      )!.style.display = "none";
      document.querySelector<HTMLDivElement>(
        ".examFinishDialog",
      )!.style.display = "none";
      state.currentPage = "exam";
    });

  document.querySelectorAll<HTMLDivElement>("div[data-qidx]")!.forEach((el) => {
    const qId = parseInt(el.getAttribute("data-qid")!);
    const qIdx = parseInt(el.getAttribute("data-qidx")!);
    document
      .querySelector<HTMLDivElement>(
        `div.questionControls > div > div:nth-child(${
          qIdx + 1
        }) > button > div`,
      )!
      .setAttribute("data-jumpId", String(qId));
  });

  selectQuestion(1);
  document.querySelector<HTMLDivElement>("#__Loading_Box")!.style.display =
    "none";
  document.querySelector<HTMLDivElement>(".examFinishOverlay")!.style.display =
    "none";
  countdownTimer(endsDate, finishExam);
  setInterval(countdownTimer(endsDate, finishExam), 1000);
  state.currentPage = "exam";
}

export async function finishExam() {
  state.examFinished = true;
  document.querySelector<HTMLDivElement>(".examFinishOverlay")!.style.display =
    "unset";
  document.querySelector<HTMLDivElement>("#__Loading_Box")!.style.display =
    "flex";
  document.querySelector<HTMLButtonElement>(
    ".testControl > div:nth-child(2) > button",
  )!.style.display = "none";

  let answers: AnswerT[];
  try {
    answers = await get_answer_data(getLanguage(), state.questionIDs);
  } catch {
    alert(await strings("errorEnd"));
    return;
  }

  const answered = state.selectedAnswers ? state.selectedAnswers : {};

  answers.forEach((answer) => {
    const answerElements = document.querySelectorAll<HTMLDivElement>(
      `div[data-qid="${answer.id}"] > div:nth-child(2) > button > div > span:nth-of-type(2)`,
    )!;
    answerElements.forEach((a, idx) => {
      if (answer.correct.includes(idx + 1)) {
        a.setAttribute("class", "questionCorrectAnswer");
      } else {
        a.setAttribute("class", "questionIncorrectAnswer");
      }
    });
  });

  document
    .querySelectorAll<HTMLButtonElement>(
      `div[data-qid] > div:nth-child(2) > button`,
    )!
    .forEach((btn) => {
      btn.disabled = true;
    });

  document
    .querySelectorAll<HTMLDivElement>(
      "div.questionControls > div > div > button > div",
    )!
    .forEach((qCtrl) => {
      qCtrl.setAttribute("class", "questionButtonIncorrectAnswer");
    });

  answers.forEach((answer) => {
    if (
      answered.hasOwnProperty(answer.id) &&
      areArraysEqualSets(answer.correct, answered[answer.id])
    )
      document
        .querySelector<HTMLDivElement>(`div[data-jumpId="${answer.id}"]`)!
        .setAttribute("class", "questionButtonCorrectAnswer");
  });

  document.querySelector<HTMLSpanElement>("#__Res_Pass")!.innerHTML =
    document.querySelectorAll<HTMLDivElement>(
      "div.questionButtonIncorrectAnswer",
    )!.length > 6
      ? await strings("examFail")
      : await strings("examPass");
  document.querySelector<HTMLDivElement>(
    ".examFinishDialog > div:first-child",
  )!.style.backgroundColor =
    document.querySelectorAll<HTMLDivElement>(
      "div.questionButtonIncorrectAnswer",
    )!.length > 6
      ? "#FF7C80"
      : "#92D050";
  document.querySelector<HTMLSpanElement>(
    "#__Res_CorrectAnswers",
  )!.innerHTML = `${
    document.querySelectorAll<HTMLDivElement>(
      "div.questionButtonCorrectAnswer",
    )!.length
  } (${getTestPercentage(
    document.querySelectorAll<HTMLDivElement>(
      "div.questionButtonCorrectAnswer",
    )!.length,
  )})`;
  document.querySelector<HTMLSpanElement>(
    "#__Res_IncorrectAnswers",
  )!.innerHTML = `${
    document.querySelectorAll<HTMLDivElement>(
      "div.questionButtonIncorrectAnswer",
    )!.length
  } (${getTestPercentage(
    document.querySelectorAll<HTMLDivElement>(
      "div.questionButtonIncorrectAnswer",
    )!.length,
  )})`;

  document.querySelector<HTMLDivElement>("#__Loading_Box")!.style.display =
    "none";
  document.querySelector<HTMLDivElement>(".examFinishDialog")!.style.display =
    "unset";
  state.currentPage = "answers";
}

function getTestPercentage(answers: number): string {
  const x = Math.floor(100 / (30 / answers));
  return `${x}%`;
}
