--
-- Copyright (C) zxyz 2024
-- This Source Code Form is subject to the terms
-- of the Mozilla Public License, v. 2.0. If a
-- copy of the MPL was not distributed with this
-- file, You can obtain one at https://mozilla.org/MPL/2.0/.
--

CREATE TABLE meta (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE languages (
  language_code TEXT PRIMARY KEY,
  display_name TEXT
);

CREATE TABLE category (
  name TEXT PRIMARY KEY,
  display_name TEXT,
  makeup TEXT,
  question_amount INTEGER
);

CREATE TABLE images (
  image_id INTEGER PRIMARY KEY,
  image_name TEXT,
  data TEXT,
  height INTEGER,
  width INTEGER,
  mimetype TEXT
);

CREATE TABLE image_alt_text (
  id INTEGER PRIMARY KEY,
  image_id INTEGER,
  language TEXT,
  alt_text TEXT,
  FOREIGN KEY (image_id) REFERENCES images (image_id)
);

CREATE TABLE questions (
  id INTEGER PRIMARY KEY,
  language TEXT,
  category TEXT,
  question_text TEXT,
  image_id INTEGER,
  FOREIGN KEY (image_id) REFERENCES images (image_id)
);

CREATE TABLE possible_answers (
  id INTEGER PRIMARY KEY,
  question_id INTEGER,
  answer_text TEXT,
  answer_order INTEGER,
  FOREIGN KEY (question_id) REFERENCES questions (id)
);

CREATE TABLE correct_answers (
  id INTEGER PRIMARY KEY,
  question_id INTEGER,
  answer_id INTEGER,
  FOREIGN KEY (question_id) REFERENCES questions (id)
);

INSERT INTO meta (key, value)
VALUES
('version', '2.0');
