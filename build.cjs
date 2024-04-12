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

const CURRENT_SCHEMA_VERSION = "v1";

/**
 * Some type definitions for our SQLite tables.
 *
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
 *  key: string,
 *  value: string
 * }} Meta
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
  case "import":
    InvokeImport();
    break;
  case "version":
    CheckVersion();
    break;
  case "update":
    UpdateCLI();
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
    import        Imports data in bulk
    version       Check the schema version of current database
    update        Database migration/update CLI
    help          Prints this message

Import commands: (usage: node build.js import [command])
    migrate_v0_images   Migrate old images into database
    migrate_v0_json     Migrate old JSON-format questions

regitra-parody is in development, some features you expect may not be there.
regitra-parody is licensed under MPL-2.0 and includes no warranty.`,
  );
}

function InvokeImport() {
  switch (process.argv[3]) {
    case "migrate_v0_images":
      MigrateLegacyImages();
      break;
    case "migrate_v0_json":
      MigrateLegacyJson();
      break;
    default:
      PrintHelp();
      break;
  }
}

function CheckVersion() {
  let db = new sqlite3.Database(dbName);

  db.get(`select value from meta where key = 'version'`, (err, value) => {
    if (err) {
      if (err.message.includes("no such table: meta")) {
        console.log("v0");
      } else {
        console.error(err);
        process.exit(1);
      }

      process.exit(0);
    } else {
      console.log(value.value);
    }
  });
}

function UpdateCLI() {
  switch (process.argv[3]) {
    case "v0v1":
      InvokeUpdate("v0v1");
      return;
  }

  console.log(`Latest schema version: ${CURRENT_SCHEMA_VERSION}`);
  console.log(
    `! Get your current schema version using "node build.cjs version"`,
  );
  console.log(`Available migrations:`);
  console.log(`  v0 => v1 | Invoke using "node build.cjs update v0v1"`);
}

function InvokeUpdate(migration) {
  const migrations = {
    v0v1: {
      description: "Adds meta table to track schema version.",
      update: function () {
        let db = new sqlite3.Database(dbName);
        db.serialize(() => {
          db.run(`
            CREATE TABLE meta (
              key TEXT PRIMARY KEY,
              value TEXT
            );
          `);

          db.run(`
            INSERT INTO meta (key, value)
            VALUES
            ('version', 'v1');
          `);

          db.close((error) => {
            if (error) {
              return console.error(error.message);
            }
          });

          console.log(`Migration successful.`);
        });
      },
    },
  };

  console.log(`Invoking migration: ${migration}`);
  console.log(`Description: ${migrations[migration].description}`);
  migrations[migration].update();
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
      CREATE TABLE meta (
        key TEXT PRIMARY KEY,
        value TEXT
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

    db.run(`
      INSERT INTO meta (key, value)
      VALUES
      ('version', '${CURRENT_SCHEMA_VERSION}');
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
          "as well as the support for B and A categories. You should see build.cjs for:\n" +
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

const imageFolderPath = "./src/_data/images";

function MigrateLegacyImages() {
  let db = new sqlite3.Database(dbName);

  fs.readdir(imageFolderPath, (err, files) => {
    if (err) {
      console.error("Error reading image folder:", err);
      return;
    }

    // Process each image file
    files.forEach((file) => {
      const imagePath = `${imageFolderPath}/${file}`;

      // Use the 'file' command to determine the MIME type
      exec(`file --mime-type -b "${imagePath}"`, (error, stdout) => {
        if (error) {
          console.error(`Error running 'file' command for ${file}:`, error);
          return;
        }

        // Read the image file and convert it to base64
        const imageBuffer = fs.readFileSync(imagePath);
        const imageBase64 = imageBuffer.toString("base64");

        // Insert the image data into the 'images' table
        db.run(
          "INSERT INTO images (image_name, image_data_uri) VALUES (?, ?)",
          [file, `data:${stdout.trim()};base64,${imageBase64}`],
          (insertError) => {
            if (insertError) {
              console.error(
                `Error inserting ${file} into the database:`,
                insertError,
              );
            } else {
              console.log(`Inserted ${file} into the database.`);
            }
          },
        );
      });
    });
  });
}

function MigrateLegacyJson() {
  let db = new sqlite3.Database(dbName);

  /**
   * Once again, the default.
   * These were the supported languages
   * and categories before the SQLite migration
   */

  const supportedLanguages = ["lt", "en"];
  const supportedCategories = ["a", "b"];

  // Function to insert a question into the 'questions' table
  function insertQuestion(question, imageId, callback) {
    db.run(
      "INSERT INTO questions (language, category, question_text, image_id) VALUES (?, ?, ?, ?)",
      [question.language, question.category, question.q, imageId],
      function (err) {
        if (err) {
          console.error("Error inserting question:", err);
          callback(err);
        } else {
          console.log(`Inserted question with ID: ${this.lastID}`);
          callback(null, this.lastID);
        }
      },
    );
  }

  // Function to insert possible answers and correct answers
  function insertAnswers(
    questionId,
    possibleAnswers,
    correctAnswerIndices,
    callback,
  ) {
    const insertPossibleAnswersStmt = db.prepare(
      "INSERT INTO possible_answers (question_id, answer_text) VALUES (?, ?)",
    );

    const insertCorrectAnswersStmt = db.prepare(
      "INSERT INTO correct_answers (question_id, answer_id) VALUES (?, ?)",
    );

    let insertedAnswerIds = []; // To store the IDs of the inserted possible answers

    // Insert possible answers
    possibleAnswers.forEach((answerText) => {
      insertPossibleAnswersStmt.run(questionId, answerText, function (err) {
        if (err) {
          console.error("Error inserting possible answer:", err);
          callback(err);
        } else {
          // Get the last inserted row ID, which is the answer ID
          const answerId = this.lastID;
          insertedAnswerIds.push(answerId);
        }
      });
    });

    insertPossibleAnswersStmt.finalize((err) => {
      if (err) {
        console.error("Error finalizing possible answers:", err);
        callback(err);
      } else {
        // Insert correct answers using the 1-based indices from the JSON
        correctAnswerIndices.forEach((correctIndex) => {
          if (correctIndex >= 1 && correctIndex <= insertedAnswerIds.length) {
            const answerId = insertedAnswerIds[correctIndex - 1];
            insertCorrectAnswersStmt.run(questionId, answerId, function (err) {
              if (err) {
                console.error("Error inserting correct answer:", err);
                callback(err);
              }
            });
          }
        });

        insertCorrectAnswersStmt.finalize((err) => {
          if (err) {
            console.error("Error finalizing correct answers:", err);
            callback(err);
          } else {
            callback(null);
          }
        });
      }
    });
  }
  // Function to migrate questions from a JSON file
  function migrateQuestions(language, category, callback) {
    const questionsFileName = `${language}.${category}.q.json`;
    const answersFileName = `${language}.${category}.a.json`;

    const questionsData = JSON.parse(
      fs.readFileSync(`./src/_data/${questionsFileName}`, "utf8"),
    );

    const answersData = JSON.parse(
      fs.readFileSync(`./src/_data/${answersFileName}`, "utf8"),
    );

    let pendingInserts = Object.keys(questionsData).length;

    for (const questionId in questionsData) {
      const question = questionsData[questionId];
      let imageName = question.i;
      let imageId = null;

      if (imageName) {
        imageName = imageName.replaceAll("%20", " ");
      }
      // Query the 'images' table to get the image ID by name
      db.get(
        "SELECT image_id FROM images WHERE image_name = ?",
        [imageName],
        (err, row) => {
          if (err) {
            console.error("Error querying images:", err);
          }

          if (!row) {
            console.error(`Image not found for question: ${questionId}`);
          } else {
            imageId = row.image_id;
          }

          // Insert the question into the 'questions' table
          insertQuestion(
            { language, category, ...question },
            imageId,
            (err, _questionId) => {
              if (err) {
                console.error("Error inserting question:", err);
              } else {
                insertAnswers(
                  _questionId,
                  question.a,
                  answersData[questionId],
                  (err) => {
                    if (err) {
                      console.error(
                        "Error inserting possible and correct answers:",
                        err,
                      );
                    }
                    pendingInserts--;
                    if (pendingInserts === 0) {
                      callback();
                    }
                  },
                );
              }
              pendingInserts--;
              if (pendingInserts === 0) {
                callback();
              }
            },
          );
        },
      );
    }
  }

  // Initialize the database schema if needed

  let migrationsCount = 0;

  // For each supported language and category, migrate the questions
  for (const language of supportedLanguages) {
    for (const category of supportedCategories) {
      migrateQuestions(language, category, () => {
        migrationsCount++;
        if (
          migrationsCount ===
          supportedLanguages.length * supportedCategories.length
        ) {
          // All migrations have completed, close the database handle
          db.close();
        }
      });
    }
  }
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
        <style>
html {
  max-width: 70ch;
  padding: 3em 1em;
  margin: auto;
  line-height: 1.75;
  font-size: 1.25em;
}

h1,h2,h3,h4,h5,h6 {
  margin: 3em 0 1em;
}

p,ul,ol {
  margin-bottom: 2em;
  color: #1d1d1d;
  font-family: sans-serif;
}
pre {
  white-space: pre-wrap;
}
        </style>
      </head>
      <body>
        ${slot}
        <footer>
        <p style="font-size:small;">regitra-parody (C) x-t, licensed under MPL-2.0</p>
        </footer>
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
      <p>Keep in mind: this is for inspection, not development.</p>
      <p>To create/edit questions use an SQL editor or available import tools.</p>
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
            /** @type string[] */
            let concat = [];
            let toGo = images.length;
            for (let i in images) {
              db.all(
                "select * from image_alt_text where image_id = ?",
                [images[i].image_id],
                /** @param {ImageAltText[]} alt_t */
                (err, alt_t) => {
                  concat.push(`
                    <p>${images[i].image_id} - ${images[i].image_name}</p>
                    <img style="max-width:256px;max-height:256px;" src="${images[i].image_data_uri}" />
                  `);
                  for (let t in alt_t) {
                    concat.push(
                      "<pre>" + JSON.stringify(alt_t[t], null, 2) + "</pre>",
                    );
                  }
                  toGo--;
                  if (toGo === 0) {
                    resolve(template(concat.join("")));
                  }
                },
              );
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
          /**
           * Return a 200 code with a 404 reponse.
           * This ensures that:
           * - churches burn
           * - the poor starve
           * - Microsoft prospers
           * - JavaScript is still used to write everything
           * - everything bad will continue being bad
           * - that God no longer loves us
           *
           * No, but seriously, don't do this.
           * This server should never be used in production.
           * Therefore I can get away.
           * You can't.
           * You can't run.
           */
          res.write("404");
          break;
      }
      res.end();
    })
    .listen(8080);
  console.log("Listening on http://localhost:8080");
}
