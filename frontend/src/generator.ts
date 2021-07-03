import { strings } from "./strings";
import { getLanguage } from "./lang";
import { Question } from "./main";

export const generateQuestion = (qi: Question, idx: number) => {
  let divQ = document.createElement("div");
  divQ.setAttribute("class", "testQuestion");
  divQ.setAttribute("data-qId", String(qi.id));
  divQ.setAttribute("data-qIdx", String(idx));

  const imageS = qi.image
    ? `<img alt="${
        strings[getLanguage()].noIllustration
      }" aria-label="There is a picture here, but we cannot describe it to you. Sorry." src="${
        qi.image
      }" />`
    : `<p>${strings[getLanguage()].noIllustration}</p>`;
  const answerS = qi.answers.reduce((agg, cur, _idx) => {
    return (agg += `
    <button id="answer-${idx}-${_idx + 1}"><div data-answerIndex="${idx}-${
      _idx + 1
    }"><span>${
      _idx + 1
    }.</span><div class="checkbox" data-checked="false"></div><span>${cur}</span></div></button>
    `);
  }, "");

  divQ.innerHTML = `
        <div>
          <div>
            ${imageS}
          </div>
          <div>
          <textarea readonly>${qi.q}</textarea>
          </div>
        </div>
        <div>
          ${answerS}
        </div>
  `;

  return divQ.outerHTML;
};

export const generateQuestions = (qs: Question[]) => {
  let congregate = "";
  qs.forEach((q, idx) => {
    congregate += generateQuestion(q, idx);
  });
  return congregate;
};
