/**
 * Copyright (C) zxyz 2023
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { strings } from "../i18n";
import { Question } from "../exam";

export async function generateQuestion(qi: Question, idx: number) {
  let divQ = document.createElement("div");
  divQ.setAttribute("class", "testQuestion");
  divQ.setAttribute("data-qId", String(qi.id));
  divQ.setAttribute("data-qIdx", String(idx));

  const imageS = qi.image
    ? `<picture>${(() => {
        let agg = "";
        for (let fmt of qi.img_fmts!) {
          agg += `<source srcset="${(() => {
            let agg2 = "";
            let count = 0;
            for (let size of qi.img_sizes!) {
              count++;
              agg2 += `/artifacts/img/${qi.image}-${size}.${fmt} ${count}x`;
              agg2 += count === qi.img_sizes!.length ? "" : ",";
            }
            return agg2;
          })()}" type="image/${fmt}">`;
        }
        return agg;
      })()}<img alt="${qi.alt ? qi.alt : await strings("noAlt")}" src="/generated/img/${
        qi.image
      }-orig.${qi.img_fmts![1]}" decoding="async" /></picture>`
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
          <span>${qi.q}</span>
          </div>
        </div>
        <div>
          ${answerS}
        </div>
  `;

  return divQ.outerHTML;
}

export async function generateQuestions(qs: Question[]) {
  let congregate = "";
  let promises = qs.map((q, idx) => {
    return generateQuestion(q, idx);
  });
  let settled = await Promise.all(promises);
  settled.forEach((q) => {
    congregate += q;
  });
  return congregate;
}
