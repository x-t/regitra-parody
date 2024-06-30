/**
 * Copyright (C) zxyz 2024
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

#pragma once

#include <cjson/cJSON.h>
#include <sqlite3.h>
#include <stddef.h>
#include <stdbool.h>

#include <cnhash.h>

#include "sql_help.h"

#define DB_NAME "content.db"
#define THREAD_COUNT 5

#define REQUIRE_MAJOR_SCHEMA_VERSION 2
#define REQUIRE_MINOR_SCHEMA_VERSION 0

struct ImageDimensions {
    int height;
    int width;
};

struct MetaInfo {
    char* version;
    char* default_language;
    char* default_category;
};

struct DatabaseWithData {
    sqlite3* db;
    void* data;
};

struct CategoryCountPassthrough {
    char* language_code;
    void* data;
};

struct Question {
    int id;
    int relative_id;
    char* language;
    char* category;
    char* question_text;
    int image_id;
    char* alt_text;
    bool* sizes;
    char* extension;
};

struct QuestionCallbackPassthrough {
    sqlite3* db;
    struct Question* questions;
    int question_count;
    int question_iterator;
    cnhashtable* counts_table;
};

struct Image {
    int image_id;
    void* data;
    int data_size;
    bool alt_text;
    char* mimetype;
    int height;
    int width;
};

struct ImageAlt {
    int id;
    int image_id;
    char* language;
    char* alt_text;
};

struct ImageCallbackPassthrough {
    sqlite3* db;
    struct Image* images;
    int images_count;
    int image_iterator;
};

void make_directory_structure(void);
int get_int_len(int value);
void build_main(void);

