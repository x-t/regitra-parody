# regitra-parody

[![Impossible driving theory questions - Bad Robots 4od
](https://img.youtube.com/vi/_fTxKBN6keg/0.jpg)](http://www.youtube.com/watch?v=_fTxKBN6keg)

This video, but in real life. Also in Lithuania, not UK.

Go take a test, I'm sure you'll ~~not~~ pass: [regitra.pages.dev](https://regitra.pages.dev).

## A note for the traveler

**The source code does not contain the questions nor answers.** In order to see the last commit with the questions present in the source code, visit [here](https://github.com/x-t/regitra-parody/tree/3430fd8ebfb7b5362261705c5d2ee8776c1008e5). Then, you can use the [build.js](build.js) tool to migrate the old JSON format questions into the new SQLite database. Or, you can just start anew and write your own questions in a new database, create it using `node build.js new_db`.

**This site does not use a backend.** All questions and answers are in static hosted JSON compiled from an SQLite database. This means it's not usable for anyone that wants to make an actual testing system out of this. I don't know why you would, but previous commits have a Rust backend (which doesn't work) with Google Sheets as a database (which is hilarious) [here](https://github.com/x-t/regitra-parody/tree/6ad23dad2284a48f70571239791b52a3f1f3fe4b).

The source code is straight abuse of TypeScript, JavaScript and Vite.

There is no framework used, because what's the point? Vanilla is fast and good enough.

i18n? Built from the ground up. (it's not even that complicated, there are 10 strings...)

Tests? Might do them one day in the future.

Can it run in production? Probably. It's not particularly useful as you would need extensive modification to actually make any real product with this. In the end, I do not care what you do, just respect the [license](LICENSE).
