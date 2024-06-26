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

const CURRENT_SCHEMA_VERSION = "v4";
const DB_NAME = "./content.db";

/**
 * Chapters:
 *
 * 1 - START
 * 2 - ARGS
 * 3 - HELP
 * 4 - VERSION
 * 5 - NEW DATABASE
 * 6 - ITERATOR
 * 7 - BUILD
 * 8 - DOWNLOAD
 * 9 - IMPORT JSON
 * 10 - IMPORT IMAGES
 *
 * To navigate to the beginning of a chapter, cmd+f using its name
 * To navigate to the end of a chapter, cmd+f its name again
 */

/* --- START --- */

if (process.argv.length === 2) {
  PrintHelp();
  process.exit(1);
}

const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { exec, execSync } = require("child_process");
const https = require("https");

const dbName = DB_NAME;

/* --- START --- */

/* --- ARGS --- */

switch (process.argv[2]) {
  case "new_db":
    NewDatabase();
    break;
  case "build_src":
    BuildSrc();
    break;
  case "build":
    Build();
    break;
  case "download":
    DownloadDB();
    break;
  case "import":
    InvokeImport();
    break;
  case "version":
    CheckVersion();
    break;
  case "help":
  default:
    PrintHelp();
    break;
}

function InvokeImport() {
  switch (process.argv[3]) {
    case "questions":
      ImportV3JSON();
      break;
    case "images":
      ImportV3Images(false);
      break;
    case "all":
      ImportV3Images(true);
      break;
    default:
      PrintImportHelp();
      break;
  }
}

/* --- ARGS --- */

/* --- HELP --- */

function PrintHelp() {
  console.log(
    `The build system for regitra-parody for schema version ${CURRENT_SCHEMA_VERSION}

Usage: node build.cjs [command]

Available commands: will be performed on ${DB_NAME}
    new_db        Creates a new database
    build_src     Builds ./src/generated
    build         Builds ./public/generated
    download      Downloads .db file from env/DATABASE_URL
    import        Imports data in bulk
    version       Check the schema version of current database
    help          Prints this message

regitra-parody is in development, some features you expect may not be there.
regitra-parody is licensed under MPL-2.0 and includes no warranty.`,
  );
}

function PrintImportHelp() {
  console.log(
    `Import system for regitra-parody schema ${CURRENT_SCHEMA_VERSION}

Usage: node build.cjs import [command]

Import commands: (usage: node build.js import [command])
    all           Import all data
    images        Import images exclusively
    questions     Import questions exclusively

To see how to arrange your data for import, see the hitchhiker's guide.`,
  );
}

/* --- HELP --- */

/* --- VERSION --- */

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

/* --- VERSION --- */

/* --- NEW DATABASE --- */

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
        display_name TEXT,
        makeup TEXT,
        question_amount INTEGER
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
        relative_answers INTEGER,
        FOREIGN KEY (image_id) REFERENCES images (image_id)
      );
    `);

    db.run(`
      CREATE TABLE possible_answers (
        id INTEGER PRIMARY KEY,
        question_id INTEGER,
        answer_text TEXT,
        answer_order INTEGER,
        FOREIGN KEY (question_id) REFERENCES questions (id)
      );
    `);

    db.run(`
      CREATE TABLE correct_answers (
        id INTEGER PRIMARY KEY,
        question_id INTEGER,
        answer_id INTEGER,
        answer_id_relative INTEGER,
        FOREIGN KEY (question_id) REFERENCES questions (id),
        FOREIGN KEY (answer_id) REFERENCES possible_answers (id)
      );
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
          "For more information, consult the hitchhiker's guide.\n\n" +
          "\x1b[31mRegitra Parody's site in hosted or source form, nor the build tool, nor the\n" +
          "database are given any warranty or legal protection.\n" +
          "Do everything at your own risk.\x1b[0m",
      );
    });
  });
}

/* --- NEW DATABASE --- */

/* --- ITERATOR --- */

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

/* --- ITERATOR --- */

/* --- BUILD --- */

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

function BuildSrc() {
  console.log("[build.cjs] Building ./src/generated...");

  BuildCount();

  let db = new sqlite3.Database(dbName);
  const packageJson = JSON.parse(fs.readFileSync("./package.json"));

  db.serialize(() => {
    db.all(`select * from meta`, (err, meta_db) => {
      let meta = {};

      for (let m of meta_db) {
        meta[m.key] = m.value;
      }

      const versionsJson = JSON.stringify({
        version: packageJson.version,
        schemaVersion: meta["version"],
      });

      let defaultsMap = {
        l: meta["default_language"],
        c: meta["default_category"],
      };

      fs.writeFileSync(
        "./src/generated/defaults.json",
        JSON.stringify(defaultsMap),
      );

      fs.writeFileSync("./src/generated/versions.json", versionsJson);
    });

    db.all(`select * from languages`, (err, languages) => {
      fs.writeFileSync(
        "./src/generated/languages.json",
        JSON.stringify(languages.map((l) => l.language_code)),
      );
    });

    db.all(`select * from category`, (err, categories) => {
      let categoryMap = {};
      for (const c of categories) {
        categoryMap[c["name"]] = {
          makeup: JSON.parse(c["makeup"]),
          qNum: c["question_amount"],
        };
      }

      fs.writeFileSync(
        "./src/generated/categories.json",
        JSON.stringify(categoryMap),
      );
    });

    db.close((err) => {
      if (err) console.log(err);
    });
  });
}

function resizeCalc(width, height, maxWidth, maxHeight) {
  const aspectRatio = height / width;
  let newDim = [0, 0];
  if (width > maxWidth) {
    newDim[0] = maxWidth;
    newDim[1] = Math.round(maxWidth * aspectRatio);
  }

  if (height > maxHeight) {
    newDim[1] = maxHeight;
    newDim[0] = Math.round(maxHeight / aspectRatio);
  }

  if (newDim[0] > maxWidth || newDim[1] > maxHeight)
    return resizeCalc(newDim[0], newDim[1]);

  if (newDim[0] == 0 && newDim[1] == 0) newDim = [width, height];

  return newDim;
}

function Build() {
  console.log("[build.cjs] Building ./public/generated...");

  const sharp = require("sharp");

  let db = new sqlite3.Database(dbName);

  execSync("mkdir -p ./public/generated/img");

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
              if (row.relative_answers) {
                // New style relative answer IDs
                answers = answers.sort((a, b) =>
                  a.answer_order > b.answer_order
                    ? 1
                    : a.answer_order < b.answer_order
                      ? -1
                      : 0,
                );
              } else {
                // Legacy absolute answer IDs
                answers = answers.sort((a, b) =>
                  a.id > b.id ? 1 : a.id < b.id ? -1 : 0,
                );
              }

              question["a"] = answers.map((v) => v.answer_text);
              db.all(
                `select * from correct_answers where question_id = ?`,
                [row.id],
                /**
                 * @param {CorrectAnswer[]} corrects
                 */
                (err, corrects) => {
                  if (row.relative_answers) {
                    corrects = corrects.sort((a, b) =>
                      a.answer_id_relative > b.answer_id_relative
                        ? 1
                        : a.answer_id_relative < b.answer_id_relative
                          ? -1
                          : 0,
                    );
                  } else {
                    corrects = corrects.sort((a, b) =>
                      a.id > b.id ? 1 : a.id < b.id ? -1 : 0,
                    );
                  }

                  /** @type number[] */
                  let _corrects = [];

                  if (row.relative_answers) {
                    _corrects = corrects.map((v) => v.answer_id_relative);
                  } else {
                    _corrects = corrects.map((v) => v.answer_id);
                  }

                  /** @type number[] */
                  let ans = answers.map((v) => v.id);
                  /** @type number[] */
                  let cor = [];

                  if (row.relative_answers) {
                    cor = _corrects;
                  } else {
                    cor = _corrects.map((v) => ans.indexOf(v) + 1);
                  }

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
                      async (err, img) => {
                        let extension = img.image_data_uri.substring(
                          img.image_data_uri.indexOf("/") + 1,
                          img.image_data_uri.indexOf(";"),
                        );

                        let b64image = img.image_data_uri.substring(
                          img.image_data_uri.indexOf(",") + 1,
                        );

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

                        // Mobile: Images are viewed in max-width: 300px;max-height: 200px;
                        // Desktop: Images are viewed in max-width: 400px;max-height: 300px;
                        const resolution_table = {
                          sm: { w: 400 * 0.75, h: 300 * 0.75 },
                          md: { w: 400 * 1.5, h: 300 * 1.5 },
                          lg: { w: 400 * 2.25, h: 300 * 2.25 },
                          orig: { w: 400 * 3, h: 300 * 3 },
                        };

                        let qualifies_for_sizes = [];

                        for (let res in resolution_table) {
                          if (
                            orig_img_dimensions.w > resolution_table[res].w &&
                            orig_img_dimensions.h > resolution_table[res].h
                          ) {
                            qualifies_for_sizes.push(res);
                          }
                        }

                        if (!qualifies_for_sizes.includes("orig")) {
                          qualifies_for_sizes.push("orig");
                        }

                        if (
                          !fs.existsSync(
                            `./public/generated/img/${row.image_id}-orig.${extension}`,
                          )
                        ) {
                          for (let res of qualifies_for_sizes) {
                            let max_width = resolution_table[res].w;
                            let max_height = resolution_table[res].h;

                            let [new_width, new_height] = resizeCalc(
                              orig_img_dimensions.w,
                              orig_img_dimensions.h,
                              max_width,
                              max_height,
                            );

                            let resized_buffer = await orig_img_sharp.resize(
                              new_width,
                              new_height,
                            );

                            await resized_buffer
                              .webp({ quality: 80 })
                              .toFile(
                                `./public/generated/img/${row.image_id}-${res}.webp`,
                              );

                            await resized_buffer.toFile(
                              `./public/generated/img/${row.image_id}-${res}.${extension}`,
                            );
                          }
                        }

                        question["i"] = row.image_id;
                        question["if"] = ["webp", extension];
                        question["is"] = qualifies_for_sizes;

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

/* --- BUILD --- */

/* --- DOWNLOAD --- */

function DownloadDB() {
  const url = process.env.DATABASE_URL;
  const file = fs.createWriteStream(dbName);
  const request = https.get(url, function (response) {
    response.pipe(file);
  });
}

/* --- DOWNLOAD --- */

/* --- IMPORT JSON --- */

function ImportV3JSON() {
  let db = new sqlite3.Database(dbName);

  const text_db = JSON.parse(fs.readFileSync("./import/questions.json"));

  db.serialize(() => {
    let question_count = 0;

    const image_ids = JSON.parse(fs.readFileSync("./import/image_ids.json"));

    for (let block of text_db) {
      db.run(
        `insert into questions
          (language, category, question_text, image_id, relative_answers)
          values (?,?,?,?,?);`,
        [block.l, block.c, block.q, image_ids[block.i], 1],
        function (err) {
          let question_id = this.lastID;

          let answer_count = 0;
          let answer_ids = [];

          for (let section in block.a) {
            db.run(
              `insert into possible_answers
                (question_id, answer_text, answer_order)
                values (?, ?, ?);`,
              [question_id, block.a[section], parseInt(section) + 1],
              function (err) {
                answer_count++;

                if (answer_count == block.a.length) {
                  for (let ca of block.ca) {
                    db.run(
                      `insert into correct_answers
                        (question_id, answer_id_relative)
                        values (?, ?);`,
                      [question_id, ca],
                    );
                  }
                }
              },
            );
          }
        },
      );
    }
  });
}

/* --- IMPORT JSON --- */

/* --- IMPORT IMAGES --- */

function ImportV3Images(cont) {
  let db = new sqlite3.Database(dbName);

  const image_ids_name = {};

  const alt_text_db = JSON.parse(fs.readFileSync("./import/alts.json"));

  db.serialize(() => {
    fs.readdir("./import", (err, files) => {
      if (err) {
        console.error("Error reading image folder:", err);
        return;
      }

      function importAltText() {
        let images_counter = 0;

        for (let alt_text of alt_text_db) {
          const id_db = JSON.parse(fs.readFileSync("./import/image_ids.json"));

          let id = id_db[alt_text.name];
          let texts_added = 0;

          for (let text in alt_text.alt) {
            db.run(
              `insert into image_alt_text
              (image_id, language, alt_text)
              values (?, ?, ?);`,
              [id, text, alt_text.alt[text]],
              function (err) {
                db.run(`update images set alt_text = 1 where image_id = ?`, [
                  id,
                ]);
                console.log(`Added ${text} alt text for ${alt_text.name}`);

                texts_added++;

                if (texts_added === Object.keys(alt_text.alt).length) {
                  images_counter++;

                  if (cont && images_counter == alt_text_db.length) {
                    console.log("Continuing onto JSON import...");
                    ImportV3JSON();
                  }
                }
              },
            );
          }
        }
      }

      let imported = 0;

      const image_files = files.filter(
        (file) => !file.includes(".json") && !file.includes(".DS_Store"),
      );

      // Process each image file
      for (let file of image_files) {
        if (file.includes(".json") || file.includes(".DS_Store")) {
          continue;
        }

        const imagePath = `./import/${file}`;

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
            function (insertError) {
              if (insertError) {
                console.error(
                  `Error inserting ${file} into the database:`,
                  insertError,
                );
              } else {
                console.log(`Inserted ${file} into the database.`);
                image_ids_name[file] = this.lastID;
                imported++;

                if (imported == image_files.length) {
                  fs.writeFileSync(
                    "./import/image_ids.json",
                    JSON.stringify(image_ids_name),
                  );
                  importAltText();
                }
              }
            },
          );
        });
      }
    });
  });
}

/* --- IMPORT IMAGES --- */
