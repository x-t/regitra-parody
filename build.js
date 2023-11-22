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

/**
 * MIGRATIONS:
 * Updates in schema between versions/commits.
 * Run them to upgrade a database to the newest version.
 *
 * From 0920d82 - Image alt should not be associated
 *                with an ID
 ** ALTER TABLE images
 ** DROP COLUMN alt_text;
 **
 ** ALTER TABLE images
 ** ADD COLUMN alt_text INTEGER;
 *
 * From 1d3b786 - Add multilingual alt text
 ** CREATE TABLE image_alt_text (
 **   id INTEGER PRIMARY KEY,
 **   image_id INTEGER,
 **   language TEXT,
 **   alt_text TEXT,
 **   FOREIGN KEY (image_id) REFERENCES images (image_id)
 ** );
 **
 ** ALTER TABLE images
 ** DROP COLUMN alt_text;
 **
 ** ALTER TABLE images
 ** ADD COLUMN alt_text INTEGER REFERENCES images (image_id);
 *
 * From c0878ae - Add back alt text support for images
 ** ALTER TABLE images
 ** ADD COLUMN alt_text TEXT;
 */

/**
 * Some type definitions for our SQLite tables.
 */

/**
 * @typedef {{
 *  language_code: string,
 *  display_name: string
 * }} Language
 *
 * @typedef {{
 *  name: string,
 *  display_name: string
 * }} Category
 *
 * @typedef {{
 *  image_id: number,
 *  image_name: string,
 *  image_data_uri: string,
 *  alt_text: number
 * }} Image
 *
 * @typedef {{
 *  id: number,
 *  image_id: number,
 *  language: string,
 *  alt_text: string,
 * }} ImageAltText
 *
 * @typedef {{
 *  id: number,
 *  language: string,
 *  category: string,
 *  question_text: string,
 *  image_id: number
 * }} Question
 *
 * @typedef {{
 *  id: number,
 *  question_id: number,
 *  answer_text: string
 * }} PossibleAnswer
 *
 * @typedef {{
 *  id: number,
 *  question_id: number,
 *  answer_id: number
 * }} CorrectAnswer
 */

if (process.argv.length === 2) {
  PrintHelp();
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
  case "new_db":
    NewDatabase();
    break;
  case "build:count":
  case "build_count":
    BuildCount();
    break;
  case "build":
    Build();
    break;
  case "download":
    DownloadDB();
    break;
  case "serve:debug":
  case "debug_server":
    ServeDebug();
    break;
  case "help":
  default:
    PrintHelp();
    break;
}

function PrintHelp() {
  console.log(
    `The build system for regitra-parody

Usage: node build.js [command]

Available commands:
    new_db        Creates a new database
    build_count   Builds ./src/generated/count.json
    build         Builds ./public/generated
    download      Downloads .db file from env/DATABASE_URL
    debug_server  Serves a debug server on :8080
    help          Prints this message

regitra-parody is in development, some features you expect may not be there.
regitra-parody is licensed under MPL-2.0 and includes no warranty.`,
  );
}

function NewDatabase() {
  if (fs.existsSync(dbName)) {
    console.log(
      "\x1b[31mNO!\x1b[0m\n" +
        "A database " +
        dbName +
        " \x1b[31malready exists\x1b[0m!\n" +
        "Either delete it manually or pick a different database name.",
    );
    process.exit(1);
  }

  const db = new sqlite3.Database(dbName);

  db.serialize(() => {
    db.run(`
      CREATE TABLE languages (
        language_code TEXT PRIMARY KEY,
        display_name TEXT
      );
    `);

    db.run(`
      CREATE TABLE category (
        name TEXT PRIMARY KEY,
        display_name TEXT
      );
    `);

    db.run(`
      CREATE TABLE images (
        image_id INTEGER PRIMARY KEY,
        image_name TEXT,
        image_data_uri TEXT,
        alt_text INTEGER
      );
    `);

    db.run(`
      CREATE TABLE image_alt_text (
        id INTEGER PRIMARY KEY,
        image_id INTEGER,
        language TEXT,
        alt_text TEXT,
        FOREIGN KEY (image_id) REFERENCES images (image_id)
      );
    `);

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

    db.run(`
      CREATE TABLE possible_answers (
        id INTEGER PRIMARY KEY,
        question_id INTEGER,
        answer_text TEXT,
        FOREIGN KEY (question_id) REFERENCES questions (id)
      );
    `);

    db.run(`
      CREATE TABLE correct_answers (
        id INTEGER PRIMARY KEY,
        question_id INTEGER,
        answer_id INTEGER,
        FOREIGN KEY (question_id) REFERENCES questions (id),
        FOREIGN KEY (answer_id) REFERENCES possible_answers (id)
      );
    `);

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
      console.log("\x1b[32mDatabase created successfully\x1b[0m as " + dbName);
      console.log(
        "\nYour database was created with the default settings.\n" +
          "It only contains the schema. \x1b[31mIt does not contain any questions or answers.\x1b[0m\n" +
          "In order to make those, modify the database accordingly.\n" +
          "Your database includes support for English and Lithuanian languages,\n" +
          "as well as the support for B and A categories. You should see build.js for:\n" +
          " - Available migrations from previous versions of the schema.\n" +
          " - The schema itself, so you can understand how to populate it.\n" +
          " - Possible methods of bulk importing from different formats.\n\n" +
          "Regitra Parody is built from the ground up and is a work in progress.\n" +
          "Features you might expect may not be available, so please be patient.\n\n" +
          "\x1b[31mRegitra Parody's site in hosted or source form, nor the build tool, nor the\n" +
          "database are given any warranty or legal protection.\n" +
          "Do everything at your own risk.\x1b[0m",
      );
    });
  });
}

/**
 * @param {import("sqlite3").Database} db
 * @param {(lang: Language, cat: Category) => void} callback
 */
function iterateCatsAndDogs(db, callback) {
  db.all(
    `select * from languages`,
    /**
     * @param {Language[]} langs
     */
    (err, langs) => {
      if (err) {
        console.error("Error executing the SELECT query:", err);
      } else {
        // 'rows' will contain the result of the query as an array of objects
        db.all(
          `select * from category`,
          /**
           * @param {Category[]} cats
           */
          (err, cats) => {
            if (err) {
              console.error("Error executing the SELECT query:", err);
            } else {
              langs.forEach((lang) => {
                cats.forEach((cat) => {
                  callback(lang, cat);
                });
              });
            }
          },
        );
      }
    },
  );
}

function BuildCount() {
  /**
   * @type {{[language: string]: {[category: string]: number}}}
   */
  let counts = {};
  let db = new sqlite3.Database(dbName);

  execSync(`mkdir -p ./src/generated`);

  iterateCatsAndDogs(db, (lang, cat) => {
    if (!(lang.language_code in counts)) counts[lang.language_code] = {};
    db.get(
      `select count(*) from questions where language = ? and category = ?`,
      [lang.language_code, cat.name],
      /**
       * @param {{"count(*)": number}} row
       */
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
      /**
       * @param {Question[]} rows
       */
      (err, rows) => {
        rows.forEach((row, idx) => {
          /**
           * @type {{
           *  q: string,
           *  a: string[],
           *  i: string | null,
           *  alt: string | null
           * }}
           */
          let question = {
            q: row.question_text,
          };

          db.all(
            `select * from possible_answers where question_id = ?`,
            [row.id],
            /**
             * @param {PossibleAnswer[]} answers
             */
            (err, answers) => {
              answers = answers.sort((a, b) =>
                a.id > b.id ? 1 : a.id < b.id ? -1 : 0,
              );
              question["a"] = answers.map((v) => v.answer_text);
              db.all(
                `select * from correct_answers where question_id = ?`,
                [row.id],
                /**
                 * @param {CorrectAnswer[]} corrects
                 */
                (err, corrects) => {
                  corrects = corrects.sort((a, b) =>
                    a.id > b.id ? 1 : a.id < b.id ? -1 : 0,
                  );

                  /** @type number[] */
                  let _corrects = corrects.map((v) => v.answer_id);
                  /** @type number[] */
                  let ans = answers.map((v) => v.id);
                  /** @type number[] */
                  let cor = _corrects.map((v) => ans.indexOf(v) + 1);

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
                      /**
                       * @param {Image} img
                       */
                      (err, img) => {
                        question["i"] = img.image_data_uri;
                        if (img.alt_text) {
                          db.get(
                            `select * from image_alt_text where image_id = ? and language = ?`,
                            [img.image_id, lang.language_code],
                            /**
                             * @param {ImageAltText} alttext
                             */
                            (err, alttext) => {
                              question["alt"] = alttext.alt_text;
                              writeOuts();
                            },
                          );
                        } else {
                          writeOuts();
                        }
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

function ServeDebug() {
  let http = require("http");
  let db = new sqlite3.Database(dbName);

  /**
   * @param {string} title
   * @param {string} slot
   */
  const templateHtmlBegin = (title, slot) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
      </head>
      <body>
        ${slot}
      </body>
    </html>
  `;

  const templateIndex = () =>
    templateHtmlBegin(
      "regitradebug - idx",
      `
    <main>
      <h1>Debug interface</h1>
      <h2>Here you can inspect your Regitra Parody database.</h2>
      <pre>
Database file: ${dbName}
      </pre>
      <p>View:</p>
      <p><a href="/questions">Questions</a></p>
      <p><a href="/images">Images</a></p>
    </main>
  `,
    );

  /** @returns {Promise<string>} */
  const templateQuestionsView = () => {
    return new Promise(
      /** @param {(s: string) => void} resolve */
      (resolve) => {
        /** @param {string} slot */
        let template = (slot) =>
          templateHtmlBegin(
            "regitradebug - q",
            `
      <main>
        <h1>Current questions in database</h1>
        <p><a href="/">Go back</a></p>
        <pre>${slot}</pre>
      </main>
      `,
          );

        db.all(
          "select * from questions",
          /** @param {Question[]} questions */
          (err, questions) => {
            let toGo = questions.length;
            for (let q in questions) {
              db.all(
                "select * from possible_answers where question_id = ?",
                [questions[q].id],
                /** @param {PossibleAnswer[]} answers */
                (err, answers) => {
                  questions[q].answers = answers;
                  toGo--;
                  if (toGo === 0) {
                    toGo = questions.length;
                    for (let _q in questions) {
                      db.all(
                        "select * from correct_answers where question_id = ?",
                        [questions[_q].id],
                        /** @param {CorrectAnswer[]} corrects */
                        (err, corrects) => {
                          questions[_q].correct_answers = corrects;
                          toGo--;
                          if (toGo === 0) {
                            resolve(
                              template(JSON.stringify(questions, null, 2)),
                            );
                          }
                        },
                      );
                    }
                  }
                },
              );
            }
          },
        );
      },
    );
  };

  /** @returns {Promise<string>} */
  const templateImagesView = () => {
    return new Promise(
      /** @param {(s: string) => void} resolve */
      (resolve) => {
        /** @param {string} slot */
        let template = (slot) =>
          templateHtmlBegin(
            "regitradebug - i",
            `
        <main>
          <h1>Current images in database</h1>
          <p><a href="/">Go back</a></p>
          ${slot}
        </main>
        `,
          );

        db.all(
          "select * from images",
          /** @param {Image[]} images */
          (err, images) => {
            let concat = "";
            let toGo = images.length;
            for (let i in images) {
              concat += `
                <p>${images[i].image_id} - ${images[i].image_name}</p>
                <img height="256" width="256" src="${images[i].image_data_uri}" />
              `;
              toGo--;
              if (toGo === 0) {
                resolve(template(concat));
              }
            }
          },
        );
      },
    );
  };

  http
    .createServer(async function (req, res) {
      res.writeHead(200, { "Content-Type": "text/html" });
      switch (req.url) {
        case "/":
          res.write(templateIndex());
          break;
        case "/questions":
          res.write(await templateQuestionsView());
          break;
        case "/images":
          res.write(await templateImagesView());
          break;
        default:
          res.write("404");
          break;
      }
      res.end();
    })
    .listen(8080);
  console.log("Listening on http://localhost:8080");
}
