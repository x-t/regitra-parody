/**
 * Copyright (C) zxyz 2024
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

#pragma once

#include <sqlite3.h>
#include <cjson/cJSON.h>
#include "sql_help.h"

DEFINE_SELECT_SQL_CALLBACK(languages_callback);
DEFINE_SELECT_SQL_CALLBACK(categories_callback);
DEFINE_SELECT_SQL_CALLBACK(meta_callback);
DEFINE_SELECT_SQL_CALLBACK(counter_category_callback);
DEFINE_SELECT_SQL_CALLBACK(counter_languages_callback);
void create_versions_json(struct MetaInfo meta_info,
    void* package_json_data, size_t package_json_len,
    cJSON* versions_json);
void create_languages_json(sqlite3* db, cJSON* languages_json);
void create_categories_json(sqlite3* db, cJSON* categories_json);
void create_count_json(sqlite3* db, cJSON* count_json);
void create_defaults_json(struct MetaInfo meta_info, cJSON* defaults_json);
void thread_builder_src_categories(void* data);
void thread_builder_src_languages(void* data);
void thread_builder_src_meta_def(void* data);
void thread_builder_src_meta_ver(void* data);
void thread_builder_src_count(void* data);
void build_unified_metadata_entry(void);
