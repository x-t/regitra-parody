/**
 * Copyright (C) zxyz 2024
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

#include <stdio.h>
#include <stdlib.h>
#include <stddef.h>
#include <stdbool.h>
#include <sqlite3.h>
#include <cjson/cJSON.h>
#include <sys/mman.h>
#include <string.h>

#include <tpool.h>

#include "project.h"
#include "fs.h"
#include "sql_help.h"
#include "builder_metadata.h"
#include "builder.h"

DEFINE_SELECT_SQL_CALLBACK(languages_callback) {
    cJSON* language = NULL;
    language = cJSON_CreateString(argv[0]);
    cJSON_AddItemToArray((cJSON*)data, language);
    return 0;
}

DEFINE_SELECT_SQL_CALLBACK(categories_callback) {
    cJSON* category = cJSON_CreateObject();
    int name_idx = 0;

    for (int i = 0; i < argc; i++) {
        if (!strcmp("name", column_name[i])) {
            name_idx = i;
        } else if (!strcmp("makeup", column_name[i])) {
            cJSON* makeup = cJSON_Parse(argv[i]);
            cJSON_AddItemToObject(category, "makeup", makeup);
        } else if (!strcmp("question_amount", column_name[i])) {
            cJSON* question_amount = cJSON_CreateNumber(atoi(argv[i]));
            cJSON_AddItemToObject(category, "qNum", question_amount);
        }
    }

    cJSON_AddItemToObject((cJSON*)data, argv[name_idx], category);
    return 0;
}

DEFINE_SELECT_SQL_CALLBACK(meta_callback) {
    if (!strcmp("version", argv[0])) {
        ((struct MetaInfo*) data)->version = malloc(strlen(argv[1]) + 1);
        strcpy(((struct MetaInfo*) data)->version, argv[1]);
    } else if (!strcmp("default_language", argv[0])) {
        ((struct MetaInfo*) data)->default_language = malloc(strlen(argv[1]) + 1);
        strcpy(((struct MetaInfo*) data)->default_language, argv[1]);
    } else if (!strcmp("default_category", argv[0])) {
        ((struct MetaInfo*) data)->default_category = malloc(strlen(argv[1]) + 1);
        strcpy(((struct MetaInfo*) data)->default_category, argv[1]);
    }

    return 0;
}

DEFINE_SELECT_SQL_CALLBACK(counter_category_callback) {
    int question_amount = 0;
    size_t query_length = 70 + strlen(
        (char*)(((struct CategoryCountPassthrough*)
            (((struct DatabaseWithData*) data))->data)->language_code)
        ) + strlen(argv[0]) + 1;
    char* query = malloc(query_length);

    snprintf(query, query_length - 1,
        "select count(id) from questions where language = '%s' and category = '%s'",
        (char*)(((struct CategoryCountPassthrough*)
            (((struct DatabaseWithData*) data))->data)->language_code),
        argv[0]);

    EXECUTE_SELECT_SQL(
        ((struct DatabaseWithData*) data)->db,
        query,
        counter_callback,
        (void*) &question_amount
    );

    free(query);

    cJSON* count = cJSON_CreateNumber(question_amount);

    cJSON_AddItemToObject((cJSON*)(((struct CategoryCountPassthrough*)
        (((struct DatabaseWithData*) data))->data)->data), argv[0], count);

    return 0;
}

DEFINE_SELECT_SQL_CALLBACK(counter_languages_callback) {
    cJSON* language = cJSON_CreateObject();
    struct CategoryCountPassthrough passthrough_data = {
        argv[0], (void*) language
    };
    struct DatabaseWithData passthrough = {
        ((struct DatabaseWithData*) data)->db,
        (void*) &passthrough_data
    };

    EXECUTE_SELECT_SQL(
        ((struct DatabaseWithData*) data)->db,
        "select name from category",
        counter_category_callback,
        (void*) &passthrough
    );

    cJSON_AddItemToObject(((struct DatabaseWithData*) data)->data,
        argv[0], language);

    return 0;
}

void create_versions_json(struct MetaInfo meta_info,
    void* package_json_data, size_t package_json_len,
    cJSON* versions_json) {
    char* schema_version = meta_info.version;
    const cJSON* j_version = NULL;

    cJSON* package_json = cJSON_ParseWithLength(
        (const char*) package_json_data, package_json_len);

    if (package_json == NULL) {
        const char *error_ptr = cJSON_GetErrorPtr();
        if (error_ptr != NULL) {
            fprintf(stderr, "Error before: %s\n", error_ptr);
        }
        goto end;
    }

    j_version = cJSON_GetObjectItemCaseSensitive(package_json, "version");

    if (cJSON_AddStringToObject(versions_json, "version",
        (j_version->valuestring)) == NULL) {
        goto end;
    }

    if (cJSON_AddStringToObject(versions_json, "schemaVersion",
        schema_version) == NULL) {
        goto end;
    }

end:
    cJSON_Delete(package_json);
    return;
}

void create_languages_json(sqlite3* db, cJSON* languages_json) {
    EXECUTE_SELECT_SQL(
        db,
        "select language_code from languages",
        languages_callback,
        (void*) languages_json
    );

    return;
}

void create_categories_json(sqlite3* db, cJSON* categories_json) {
    EXECUTE_SELECT_SQL(
        db,
        "select name, makeup, question_amount from category",
        categories_callback,
        (void*) categories_json
    );

    return;
}

void create_count_json(sqlite3* db, cJSON* count_json) {
    struct DatabaseWithData passthrough = {
        db, (void*)count_json };

    EXECUTE_SELECT_SQL(
        db,
        "select language_code from languages",
        counter_languages_callback,
        (void*) &passthrough
    );

    return;
}

void create_defaults_json(struct MetaInfo meta_info, cJSON* defaults_json) {
    if (cJSON_AddStringToObject(defaults_json, "l",
        (meta_info.default_language)) == NULL) {
        goto end;
    }

    if (cJSON_AddStringToObject(defaults_json, "c",
        (meta_info.default_category)) == NULL) {
        goto end;
    }


end:
    return;
}

void thread_builder_src_categories(void* data) {
    sqlite3* db;

    OPEN_SQLITE(db);

    create_categories_json(db, (cJSON*)data);

    sqlite3_close(db);

    return;
}

void thread_builder_src_languages(void* data) {
    sqlite3* db;

    OPEN_SQLITE(db);

    create_languages_json(db, (cJSON*)data);

    sqlite3_close(db);

    return;
}

void thread_builder_src_meta_def(void* data) {
    sqlite3* db;

    OPEN_SQLITE(db);

    struct MetaInfo meta_info = { NULL, NULL, NULL };

    EXECUTE_SELECT_SQL(
        db,
        "select key, value from meta where key='default_category' or key='default_language'",
        meta_callback,
        (void*) &meta_info
    );

    create_defaults_json(meta_info, (cJSON*)data);

    free(meta_info.default_category);
    free(meta_info.default_language);

    sqlite3_close(db);

    return;
}

void thread_builder_src_meta_ver(void* data) {
    sqlite3* db;

    OPEN_SQLITE(db);

    struct MetaInfo meta_info = { NULL, NULL, NULL };

    EXECUTE_SELECT_SQL(
        db,
        "select key, value from meta where key='version'",
        meta_callback,
        (void*) &meta_info
    );

    size_t package_json_len = 0;
    void* package_json_data = read_file("../package.json",
        &package_json_len);

    create_versions_json(meta_info,
        package_json_data, package_json_len, (cJSON*)data);

    free(meta_info.version);

    sqlite3_close(db);

    return;
}

void thread_builder_src_count(void* data) {
    sqlite3* db;

    OPEN_SQLITE(db);

    create_count_json(db, (cJSON*)data);

    sqlite3_close(db);

    return;
}

void build_unified_metadata_entry(void) {
    tpool_t* thread_pool;

    thread_pool = tpool_create(THREAD_COUNT);

    cJSON* unified_json = cJSON_CreateObject();

    cJSON* ver_section = cJSON_CreateObject();
    cJSON* lan_section = cJSON_CreateArray();
    cJSON* cat_section = cJSON_CreateObject();
    cJSON* cnt_section = cJSON_CreateObject();
    cJSON* def_section = cJSON_CreateObject();

    tpool_add_work(thread_pool,
        thread_builder_src_meta_def, (void*)def_section);
    tpool_add_work(thread_pool,
        thread_builder_src_meta_ver, (void*)ver_section);
    tpool_add_work(thread_pool,
        thread_builder_src_languages, (void*)lan_section);
    tpool_add_work(thread_pool,
        thread_builder_src_categories, (void*)cat_section);
    tpool_add_work(thread_pool,
        thread_builder_src_count, (void*)cnt_section);

    tpool_wait(thread_pool);

    cJSON_AddItemToObject(unified_json, "ver", ver_section);
    cJSON_AddItemToObject(unified_json, "lan", lan_section);
    cJSON_AddItemToObject(unified_json, "cat", cat_section);
    cJSON_AddItemToObject(unified_json, "cnt", cnt_section);
    cJSON_AddItemToObject(unified_json, "def", def_section);

    char* unified_output = cJSON_PrintUnformatted(unified_json);

    write_file("./artifacts/unified.json", unified_output);

    free(unified_output);
    cJSON_Delete(unified_json);
    return;
}
