/**
 * Copyright (C) zxyz 2023
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Build system for regitra-parody
 * This is absolute and total hell.
 * I hate callbacks so much.
 */

if (process.argv.length === 2) {
  console.error("Expected at least one argument!");
  process.exit(1);
}

const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { exec, execSync } = require("child_process");
const https = require("https");

const dbName = "./content.db";

switch (process.argv[2]) {
  case "db:new":
    NewDatabase();
    break;
  case "build:count":
    BuildCount();
    break;
  case "build":
    Build();
    break;
  case "download":
    DownloadDB();
    break;
}

function NewDatabase() {
  if (fs.existsSync(dbName)) {
    fs.unlinkSync(dbName);
    console.log(`Deleted existing database: ${dbName}`);
  }

  const db = new sqlite3.Database(dbName);

  db.serialize(() => {
    // Create the 'languages' table
    db.run(`
      CREATE TABLE languages (
        language_code TEXT PRIMARY KEY,
        display_name TEXT
      );
    `);

    // Create the 'category' table
    db.run(`
      CREATE TABLE category (
        name TEXT PRIMARY KEY,
        display_name TEXT
      );
    `);

    // Create the 'images' table
    db.run(`
      CREATE TABLE images (
        image_id INTEGER PRIMARY KEY,
        image_name TEXT,
        image_data_uri TEXT
      );
    `);

    // Create the 'questions' table
    db.run(`
      CREATE TABLE questions (
        id INTEGER PRIMARY KEY,
        language TEXT,
        category TEXT,
        question_text TEXT,
        image_id INTEGER,
        FOREIGN KEY (image_id) REFERENCES images (image_id)
      );
    `);

    // Create the 'possible_answers' table
    db.run(`
      CREATE TABLE possible_answers (
        id INTEGER PRIMARY KEY,
        question_id INTEGER,
        answer_text TEXT,
        FOREIGN KEY (question_id) REFERENCES questions (id)
      );
    `);

    // Create the 'correct_answers' table
    db.run(`
      CREATE TABLE correct_answers (
        id INTEGER PRIMARY KEY,
        question_id INTEGER,
        answer_id INTEGER,
        FOREIGN KEY (question_id) REFERENCES questions (id),
        FOREIGN KEY (answer_id) REFERENCES possible_answers (id)
      );
    `);

    /**
     * These are default supported languages and categories!
     * If you wish to add more, modify the database
     * accordingly.
     */

    db.run(`
      INSERT INTO languages (language_code, display_name)
      VALUES
      ('en', 'English'),
      ('lt', 'Lithuanian');
    `);

    db.run(`
      INSERT INTO category (name, display_name)
      VALUES
      ('a', 'A'),
      ('b', 'B');
    `);

    db.close((error) => {
      if (error) {
        return console.error(error.message);
      }
      console.log("Database created successfully");
    });
  });
}

function iterateCatsAndDogs(db, callback) {
  db.all(`select * from languages`, (err, langs) => {
    if (err) {
      console.error("Error executing the SELECT query:", err);
    } else {
      // 'rows' will contain the result of the query as an array of objects
      db.all(`select * from category`, (err, cats) => {
        if (err) {
          console.error("Error executing the SELECT query:", err);
        } else {
          langs.forEach((lang) => {
            cats.forEach((cat) => {
              callback(lang, cat);
            });
          });
        }
      });
    }
  });
}

function BuildCount() {
  let counts = {};
  let db = new sqlite3.Database(dbName);

  execSync(`mkdir -p ./src/generated`);

  iterateCatsAndDogs(db, (lang, cat) => {
    if (!(lang.language_code in counts)) counts[lang.language_code] = {};
    db.get(
      `select count(*) from questions where language = ? and category = ?`,
      [lang.language_code, cat.name],
      (err, row) => {
        counts[lang.language_code][cat.name] = row["count(*)"];
        fs.writeFileSync("./src/generated/count.json", JSON.stringify(counts));
      },
    );
  });
}

function Build() {
  let db = new sqlite3.Database(dbName);
  iterateCatsAndDogs(db, (lang, cat) => {
    execSync(
      `mkdir -p ./public/generated/questions/${lang.language_code}/${cat.name}`,
    );
    execSync(
      `mkdir -p ./public/generated/answers/${lang.language_code}/${cat.name}`,
    );
    db.all(
      `select * from questions where language = ? and category = ?`,
      [lang.language_code, cat.name],
      (err, rows) => {
        rows.forEach((row, idx) => {
          let question = {
            q: row.question_text,
          };
          db.all(
            `select * from possible_answers where question_id = ?`,
            [row.id],
            (err, answers) => {
              answers = answers.sort((a, b) =>
                a.id > b.id ? 1 : a.id < b.id ? -1 : 0,
              );
              question["a"] = answers.map((v) => v.answer_text);
              db.all(
                `select * from correct_answers where question_id = ?`,
                [row.id],
                (err, corrects) => {
                  corrects = corrects.sort((a, b) =>
                    a.id > b.id ? 1 : a.id < b.id ? -1 : 0,
                  );

                  /**
                   * ... I don't know either
                   */

                  corrects = corrects.map((v) => v.answer_id);
                  ans = answers.map((v) => v.id);
                  cor = corrects.map((v) => ans.indexOf(v) + 1);

                  function writeOuts() {
                    fs.writeFileSync(
                      `./public/generated/questions/${lang.language_code}/${cat.name}/${idx}.json`,
                      JSON.stringify(question),
                    );

                    fs.writeFileSync(
                      `./public/generated/answers/${lang.language_code}/${cat.name}/${idx}.json`,
                      JSON.stringify(cor),
                    );
                  }

                  if (row.image_id) {
                    db.get(
                      `select * from images where image_id = ?`,
                      [row.image_id],
                      (err, img) => {
                        question["i"] = img.image_data_uri;
                        writeOuts();
                      },
                    );
                  } else {
                    writeOuts();
                  }
                },
              );
            },
          );
        });
      },
    );
  });
}

function DownloadDB() {
  const url = process.env.DATABASE_URL;
  const file = fs.createWriteStream(dbName);
  const request = https.get(url, function (response) {
    response.pipe(file);
  });
}
