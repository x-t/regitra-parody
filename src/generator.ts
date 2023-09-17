import { strings } from "./i18n";
import { Question } from "./main";

export const generateQuestion = async (qi: Question, idx: number) => {
  let divQ = document.createElement("div");
  divQ.setAttribute("class", "testQuestion");
  divQ.setAttribute("data-qId", String(qi.id));
  divQ.setAttribute("data-qIdx", String(idx));

  const imageS = qi.image
    ? `<img alt="${
        await strings("noIllustration")
      }" aria-label="There is a picture here, but we cannot describe it to you. Sorry." src="${
        qi.image
      }" />`
    : `<p>${await strings("noIllustration")}</p>`;
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

export const generateQuestions = async (qs: Question[]) => {
  let congregate = "";
  let promises = qs.map((q, idx) => {
    return generateQuestion(q, idx);
  });
  let settled = await Promise.all(promises);
  settled.forEach((q) => {
    congregate += q;
  })
  return congregate;
};
