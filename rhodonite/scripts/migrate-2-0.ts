/**
 * Copyright (C) zxyz 2024
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/**
 * This tool migrates an old v4 (1.x) database
 * to a new 2.0 database.
 *
 * Depending on the size of your database, this tool
 * might use a lot of RAM.
 *
 * Usage: (pwd /regitra-parody/rhodonite)
 * % deno run -A --unstable-ffi scripts/migrate-2-0.ts
 */

import { Database } from "jsr:@db/sqlite@0.11";
import sharp from "npm:sharp@0.33.0";

const DB_NAME = "./content.db";
const NEW_DB = "./2.0.db"

const db = new Database(DB_NAME, { create: false });

const [version] = db.prepare("select value from meta where key = 'version'").value<[string]>()!;
console.log(`Current database version: ${version} (loading ${DB_NAME})`);

if (version !== 'v4') {
  throw Error("Database not up to date for 1.1 (v4). Must require v4 for upgrade path.");
}

console.log(`> Stage 1: Convert legacy (pre-v3) data`);

const questions = db.sql`
select * from questions;
`;

const possible_answers = db.sql`
select * from possible_answers;
`;

const correct_answers = db.sql`
select * from correct_answers;
`;

let legacy_questions = questions.filter((q) => !q.relative_answers)
let legacy_possible_answers = possible_answers.filter((p) => !p.answer_order)
let legacy_correct_answers = correct_answers.filter((c) => !c.answer_id_relative)

let new_questions = questions.filter((q) => q.relative_answers)
let new_possible_answers = possible_answers.filter((p) => p.answer_order)
let new_correct_answers = correct_answers.filter((c) => c.answer_id_relative)

console.log(`Question count: legacy ${legacy_questions.length}, new ${new_questions.length}, total ${questions.length}`)
console.log(`Possible answer count: legacy ${legacy_possible_answers.length}, new ${new_possible_answers.length}, total ${possible_answers.length}`)
console.log(`Correct answer count: legacy ${legacy_correct_answers.length}, new ${new_correct_answers.length}, total ${correct_answers.length}`)

let unified_question_data = [];

for (let q of legacy_questions) {
  let pa = legacy_possible_answers.filter((p) => p.question_id === q.id)
  pa = pa.sort((a, b) =>
    a.id > b.id ? 1 : a.id < b.id ? -1 : 0,
  );

  let ca = legacy_correct_answers.filter((c) => c.question_id === q.id);

  ca = ca.sort((a, b) =>
    a.id > b.id ? 1 : a.id < b.id ? -1 : 0,
  );
  let _corrects = [];
  _corrects = ca.map((v) => v.answer_id);
  let ans = pa.map((v) => v.id);
  let cor = [];
  cor = _corrects.map((v) => ans.indexOf(v) + 1);
  unified_question_data = [...unified_question_data, {q, pa, cor}]
}

for (let q of new_questions) {
  let pa = new_possible_answers.filter((p) => p.question_id === q.id)

  let ca = new_correct_answers.filter((c) => c.question_id === q.id);
  pa = pa.sort((a, b) =>
    a.answer_order > b.answer_order
      ? 1
      : a.answer_order < b.answer_order
        ? -1
        : 0,
  );

  ca = ca.sort((a, b) =>
    a.answer_id_relative > b.answer_id_relative
      ? 1
      : a.answer_id_relative < b.answer_id_relative
        ? -1
        : 0,
  );

  let _corrects = [];
  _corrects = ca.map((v) => v.answer_id_relative);
  let ans = pa.map((v) => v.id);
  let cor = [];
  cor = _corrects;
  unified_question_data = [...unified_question_data, {q, pa, cor}]
}

console.log(`Unified ${unified_question_data.length} questions.`)

console.log(`> Stage 2: Generate new image data.`)

const images = db.sql`
select * from images;
`;

console.log(`Image count: ${images.length}`)

let processed_images = [];

for (let img of images) {
  let extension = img.image_data_uri.substring(
                    img.image_data_uri.indexOf("/") + 1,
                    img.image_data_uri.indexOf(";"),
                  );

  let mimetype = img.image_data_uri.substring(
                  img.image_data_uri.indexOf(":") + 1,
                  img.image_data_uri.indexOf(";"),
                );

  let b64image = img.image_data_uri.substring(
    img.image_data_uri.indexOf(",") + 1,
  );

  img.image_data_uri = b64image;

  let imgBuffer = Uint8Array.from(atob(b64image), (c) =>
    c.charCodeAt(0),
  );

  const orig_img_sharp = sharp(imgBuffer, {
    animated: extension === "gif" ? true : false,
  });

  const orig_img_metadata =
    await orig_img_sharp.metadata();

  const orig_img_dimensions = {
    w: orig_img_metadata.width,
    h: orig_img_metadata.height,
  };

  processed_images = [...processed_images, {img, mimetype, orig_img_dimensions}]
}

console.log(`Processed ${processed_images.length} images.`);

console.log(`> Stage 3: Create new database.`)

const new_db = new Database(NEW_DB);
let blueprint = new TextDecoder().decode(await Deno.readFile("./scripts/new_db.sql"))
new_db.exec(blueprint)

console.log(`Created a new database as ${NEW_DB}`)

console.log(`> Stage 4: Insert new images`)

for (let img of processed_images) {
  new_db.exec(`insert into images (image_id, image_name, data, height, width, mimetype) values (?, ?, ?, ?, ?, ?);`,
    img.img.image_id, img.img.image_name, img.img.image_data_uri, img.orig_img_dimensions.h, img.orig_img_dimensions.w, img.mimetype)
}

console.log(`Insert complete.`)

console.log(`> Stage 5: Transfer unchanged data.`)

const transfer_meta = db.sql`
select * from meta where key != 'version';
`;
for (let m of transfer_meta) {
  new_db.exec(`insert into meta (key, value) values (?, ?);`, m.key, m.value)
}
const transfer_languages = db.sql`
select * from languages;
`;
for (let l of transfer_languages) {
  new_db.exec(`insert into languages (language_code, display_name) values (?, ?);`, l.language_code, l.display_name)
}
const transfer_category = db.sql`
select * from category;
`;
for (let c of transfer_category) {
  new_db.exec(`insert into category (name, display_name, makeup, question_amount) values (?, ?, ?, ?);`, c.name, c.display_name, c.makeup, c.question_amount)
}
const transfer_image_alt_text = db.sql`
select * from image_alt_text;
`;
for (let a of transfer_image_alt_text) {
  new_db.exec(`insert into image_alt_text (id, image_id, language, alt_text) values (?, ?, ?, ?)`, a.id, a.image_id, a.language, a.alt_text)
}

console.log(`Tranfer of meta:${transfer_meta.length}, languages:${transfer_languages.length}, category:${transfer_category.length}, image_alt_text:${transfer_image_alt_text.length} complete.`)

console.log(`> Stage 6: Transfer unified question and answer data.`)

for (let question of unified_question_data) {
  new_db.exec(`insert into questions (id, language, category, question_text, image_id) values (?,?,?,?,?);`,
    question.q.id, question.q.language, question.q.category, question.q.question_text, question.q.image_id);

  for (let posans in question.pa) {
    new_db.exec(`insert into possible_answers (id, question_id, answer_text, answer_order) values (?,?,?,?);`,
      question.pa[posans].id, question.pa[posans].question_id, question.pa[posans].answer_text, parseInt(posans) + 1);
  }

  for (let ca of question.cor) {
    new_db.exec(`insert into correct_answers (question_id, answer_id) values(?,?);`,
      question.q.id, ca);
  }
}

console.log(`Insert complete.`)

db.close();
new_db.close();

console.log(`Migration complete! Welcome to 2.0`)
console.log(`Consult the hitchhiker's guide for more information.`)
