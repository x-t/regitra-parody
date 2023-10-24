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
const imageFolderPath = "./src/_data/images";

switch (process.argv[2]) {
  case "db:new":
    NewDatabase();
    break;
  case "migrate:images":
    MigrateImages();
    break;
  case "migrate:json":
    MigrateJson();
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

function MigrateImages() {
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

function MigrateJson() {
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
          let countsAmount = langs.length * cats.length;
          langs.forEach((lang) => {
            cats.forEach((cat) => {
              callback(lang, cat, countsAmount);
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
  iterateCatsAndDogs(db, (lang, cat, countsAmount) => {
    if (!(lang.language_code in counts)) counts[lang.language_code] = {};
    db.get(
      `select count(*) from questions where language = ? and category = ?`,
      [lang.language_code, cat.name],
      (err, row) => {
        counts[lang.language_code][cat.name] = row["count(*)"];
        countsAmount--;
        if (countsAmount == 0) {
          fs.writeFileSync(
            "./src/generated/count.json",
            JSON.stringify(counts),
          );
        }
      },
    );
  });
}

function Build() {
  let db = new sqlite3.Database(dbName);
  iterateCatsAndDogs(db, (lang, cat, countsAmount) => {
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
