/**
 * Copyright (C) zxyz 2023
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Build system extension for regitra-parody:
 * Questions and answers are served locally (no server)
 * however, to not load big JSON/JS files in the browser
 * we split the JSON database of questions and answers
 * into small JSON files loadable using fetch() on the
 * client. We also use some trickery to count the amount
 * of questions we have for the exam generator, to generate
 * random IDs for the range of questions.
 */

const fs = require("fs");
const execSync = require("child_process").execSync;
const langs = require("./_langs.js");
const categories = require("./_categories.js");

function ObjectLength(object) {
  var length = 0;
  for (const key in object) {
    if (object.hasOwnProperty(key)) {
      ++length;
    }
  }
  return length;
}

execSync("mkdir -p ./src/generated");

let count = {};

for (const i in langs) {
  for (const c in categories) {
    const questions = JSON.parse(
      fs.readFileSync(
        `./src/_data/${langs[i]}.${categories[c]}.q.json`,
        "utf8",
      ),
    );
    if (!(langs[i] in count)) count[langs[i]] = {};
    count[langs[i]][categories[c]] = ObjectLength(questions);
    execSync(
      `mkdir -p ./public/generated/questions/${langs[i]}/${categories[c]}`,
    );
    for (const q in questions) {
      fs.writeFileSync(
        `./public/generated/questions/${langs[i]}/${categories[c]}/${q}.json`,
        JSON.stringify(questions[q]),
      );
    }

    const answers = JSON.parse(
      fs.readFileSync(
        `./src/_data/${langs[i]}.${categories[c]}.a.json`,
        "utf8",
      ),
    );
    execSync(
      `mkdir -p ./public/generated/answers/${langs[i]}/${categories[c]}`,
    );
    for (const a in answers) {
      fs.writeFileSync(
        `./public/generated/answers/${langs[i]}/${categories[c]}/${a}.json`,
        JSON.stringify(answers[a]),
      );
    }
  }
}

fs.writeFileSync("./src/generated/count.json", JSON.stringify(count));
