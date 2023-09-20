/**
 * Copyright (C) zxyz 2023
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Build system extension for regitra-parody:
 * Questions sometimes contain images, while we include
 * them in the source code, we can build them into a
 * data URI, so the image will be downloaded along
 * with the JSON file.
 */

const fs = require("fs");
const execSync = require("child_process").execSync;
const langs = require("./_langs.js");

function getMimeFromPath(filePath) {
  const mimeType = execSync(
    'file --mime-type -b "' + filePath + '"',
  ).toString();
  return mimeType.trim();
}

for (const l in langs) {
  fs.readdirSync(`./public/generated/questions/${langs[l]}`).forEach((file) => {
    const q = JSON.parse(
      fs.readFileSync(`./public/generated/questions/${langs[l]}/${file}`),
    );
    if (q.hasOwnProperty("i")) {
      const filename = `./src/_data/images/${q["i"].replaceAll("%20", " ")}`;
      const mimeType = getMimeFromPath(filename);
      const base64encoded = execSync(`cat "${filename}" | base64`);
      const uri = `data:${mimeType};base64,${base64encoded}`;
      q["i"] = uri;
      fs.writeFileSync(
        `./public/generated/questions/${langs[l]}/${file}`,
        JSON.stringify(q),
      );
    }
  });
}
