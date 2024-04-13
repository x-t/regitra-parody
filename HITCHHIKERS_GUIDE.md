# Hitchhiker's guide

## for regitra-parody

Last updated for 0.2-beta schema v3

### Table of contents

1. [This is a content management system](#this-is-a-content-management-system)
1. [build.cjs and you](#build.cjs-and-you)
1. [Language support](#language-support)
1. [Localization](#localization)
1. [Starting a new database](#starting-a-new-database)
1. [Database schema](#database-schema)
1. [Populating the database](#populating-the-database)
1. [New format import](#new-format-import)
1. [Maintaining the database](#maintaining-the-database)
1. [Database debug interface](#database-debug-interface)
1. [Stylistic choices](#stylistic-choices)
1. [Building the site](#building-the-site)
1. [License](#license)

### This is a content management system

This project does not use a backend. Everything is compiled from one SQLite3 database into a fully static website. A build is invoked before starting the dev server or the production Vite build tool engages.

All of the content is compiled using the [build.cjs](build.cjs) tool and is stored inside a `db` file, by default - `./content.db`.

[build.cjs](build.cjs) also includes a meriad of other features for managing the content database, such as importing bulk data, updating the schema in use to a newer version and a debug HTTP server to view the data in the database.

A very old build of regitra-parody includes code for a backend written in Rust, however the code quality is really bad. It can be found [here](https://github.com/x-t/regitra-parody/tree/6ad23dad2284a48f70571239791b52a3f1f3fe4b).

### build.cjs and you

To view available commands in [build.cjs](build.cjs) use:

```
$ node build.cjs help
```

To view available schema migrations (updates) use:

```
$ node build.cjs update
```

To see which updates apply to you, check your current database's version using:

```
$ node build.cjs version
```

### Language support

The database is configured in a way that can store an infinite amount of languages. However, the languages supported for the frontend are as follows:

|                                   |                |             |             |
| --------------------------------- | -------------- | ----------- | ----------- |
|                                   | **Lithuanian** | **English** | **Russian** |
| **Translation**                   | Yes            | Yes         | No          |
| **Can render in homepage picker** | Yes            | Yes         | Yes         |

### Localization

To add or complete language support do the following:

#### Translate all the strings

First translate all the strings which are required to render the page. In the following example, we will make a Portuguese translation:

```
$ cp src/i18n/en.json src/i18n/pt.json
$ vim src/i18n/pt.json
```

#### Add the ability to switch to the new language

In the front page a list of language flags are generated from the database, you will need to follow the example of [public/img/ENyes.png](public/img/ENyes.png) and [public/img/ENoff.png](public/img/ENoff.png).

```
$ cp ~/PTyes.png public/img/
$ cp ~/PToff.png public/img/
```

#### Adding the language into your database

Just insert it to the `languages` table:

```
insert into languages (language_code, display_name)
values ('pt', 'Portuguese');
```

### Starting a new database

When you clone the git repository, you will not have any content for the tests, you have to create a new database. Do it using the [build.cjs](build.cjs) tool.

```
$ node build.cjs new_db
```

### Database schema

First column is name of field, second is the type, third and onward are created alongside `build.cjs new_db`.

#### Meta

|           |        |         |
| --------- | ------ | ------- |
| **key**   | _text_ | version |
| **value** | _text_ | v3      |

#### Languages

|                   |        |         |            |
| ----------------- | ------ | ------- | ---------- |
| **language_code** | _text_ | en      | lt         |
| **display_name**  | _text_ | English | Lithuanian |

#### Category

|                     |           |                   |           |
| ------------------- | --------- | ----------------- | --------- |
| **name**            | _text_    | a                 | b         |
| **display_name**    | _text_    | A                 | B         |
| **makeup**          | _text_    | {"b": 30, "a": 5} | {"b": 30} |
| **question_amount** | _integer_ | 35                | 30        |

#### Images

|                    |           |
| ------------------ | --------- |
| **image_id**       | _integer_ |
| **image_name**     | _text_    |
| **image_data_uri** | _text_    |
| **alt_text**       | _integer_ |

#### Image alt text (`image_alt_text`)

|              |                                   |
| ------------ | --------------------------------- |
| **id**       | _integer_                         |
| **image_id** | _integer_ key **images/image_id** |
| **language** | _text_                            |
| **alt_text** | _text_                            |

#### Questions

|                      |                                   |
| -------------------- | --------------------------------- |
| **id**               | _integer_                         |
| **language**         | _text_                            |
| **category**         | _text_                            |
| **question_text**    | _text_                            |
| **image_id**         | _integer_ key **images/image_id** |
| **relative_answers** | _integer_                         |

#### Possible answers (`possible_answers`)

|                  |                                |
| ---------------- | ------------------------------ |
| **id**           | _integer_                      |
| **question_id**  | _integer_ key **questions/id** |
| **answer_text**  | _text_                         |
| **answer_order** | _integer_                      |

#### Correct answers (`correct_answers`)

|                        |                                       |
| ---------------------- | ------------------------------------- |
| **id**                 | _integer_                             |
| **question_id**        | _integer_ key **questions/id**        |
| **answer_id**          | _integer_ key **possible_answers/id** |
| **answer_id_relative** | _integer_                             |

### Populating the database

Ideally, create your own content for your database. By default the database is set up to accept English and Lithuanian questions. To add more follow the previous guide on translating and preparing the frontend and adding the language into your database support.

However, as a start you can get the legacy format JSON and image files from an old version of regitra-parody [here](https://github.com/x-t/regitra-parody/tree/3430fd8ebfb7b5362261705c5d2ee8776c1008e5) and use [build.cjs](build.cjs) to migrate it into the database.

Put the files into their appropriate places and run:

```
$ node build.cjs import migrate_v0_images
$ node build.cjs import migrate_v0_json
```

### New format import

To help importing new bulk content, you can use the `import_v2` commands after arranging all files accordingly:

```
import/
	alts.json
	questions.json
	img1.png
	img2.jpg
	[...]

build.cjs
```

`alts.json` is a file that holds all alt text information for the images. It follows this format:

```
[
	{
	"name": "img1.jpg",
	"alt": {
		"en": "First image",
		[...]
	}
	},

	[...]

]
```

`questions.json` is a file that holds all questions and answers to import. It follows this format:

```
[
	{
		// Language
		"l": "en",
		// Category
		"c": "a",
		// Question
		"q": "...",
		// Possible answers
		"a": [
			"...",
			"..."
		],
		// Correct answers
		"ca": [1, ...]
	},

	[...]

]
```

Then use this command to import the data:

```
$ node build.cjs import import_v2
```

### Maintaining the database

New features for the frontend will most likely require additional updates to the database schema, thus you'll to use the `update` tool in [build.cjs](build.cjs) to migrate your database to a newer version.

Find out your database schema's current version:

```
$ node build.cjs version
```

Find out available migrations in [build.cjs](build.cjs):

```
$ node build.cjs update
```

You can only migrate one version up. For example, if you're on `v0`, you'll first need to run the `v0 => v1` migration, then `v1 => v2`. If a migration deletes data from the database, you will get warned about that and be prompted to replace that data.

Run a migration using its name:

```
$ node build.cjs update v1v2
```

Sidenote: `v0` is a version number for any version of the schema before `v1`. For migrations before the very last version (`0b0ca3c`) of `v0` you need to follow the steps in the beginning of the `build.cjs` file.

### Database debug interface

There is a crude debug interface to view the contents of your database. Start it using:

```
$ node build.cjs debug_server
```

### Stylistic choices

Website is built using `build.cjs` and Vite. The frontend is written using vanilla TypeScript, while `build.cjs` is written in vanilla Node JavaScript.

No framework for the frontend is used. Minimal dependencies.

### Building the site

The current npm scripts are added to build/test the site.

Start the development server:

```
$ npm run dev
```

Download a database file from the `DATABASE_URL` environment variable and build the site using Vite and `build.cjs`:

```
$ npm run build:prod
```

Build the site using `build.cjs` and Vite:

```
$ npm run build
```

Build the site using Vite:

```
$ npm run build:fast
```

Build the site using `build.cjs` and Vite, then start a preview server:

```
$ npm run serve
```

Format all files:

```
$ npm run fmt
```

Clean out all built files:

```
$ npm run clean
```

### License

The project is licensed under [MPL-2.0](LICENSE). Some of site's content is from State Enterprise Regitra and Font Awesome. Depends on a couple of open source libraries: [package.json](package.json)

The official content database used in [regitra.pages.dev](regitra.pages.dev) is not shared and closed.

While the design is made to mimic the official State Enterprise Regitra's exam interface, this project was built from the ground up without using the code from the official interface.

This project has no affiliation with State Enterprise Regitra.

This project comes with no warranty and no support.
