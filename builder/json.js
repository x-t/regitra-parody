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
  const questions = JSON.parse(
    fs.readFileSync(`./src/_data/${langs[i]}.q.json`, "utf8"),
  );
  count[langs[i]] = ObjectLength(questions);
  execSync(`mkdir -p ./public/generated/questions/${langs[i]}`);
  for (const q in questions) {
    fs.writeFileSync(
      `./public/generated/questions/${langs[i]}/${q}.json`,
      JSON.stringify(questions[q]),
    );
  }

  const answers = JSON.parse(
    fs.readFileSync(`./src/_data/${langs[i]}.a.json`, "utf8"),
  );
  execSync(`mkdir -p ./public/generated/answers/${langs[i]}`);
  for (const a in answers) {
    fs.writeFileSync(
      `./public/generated/answers/${langs[i]}/${a}.json`,
      JSON.stringify(answers[a]),
    );
  }
}

fs.writeFileSync("./src/generated/count.json", JSON.stringify(count));
