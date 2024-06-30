/**
 * Copyright (C) zxyz 2024
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

#pragma once

#define OPEN_SQLITE(db) \
    do { \
        int rc; \
        \
        rc = sqlite3_open(DB_NAME, &db); \
        \
        if (rc) { \
            fprintf(stderr, "Can't open database: %s\n", \
                sqlite3_errmsg(db)); \
            exit(1); \
        } \
    } while (0)

#define DEFINE_SELECT_SQL_CALLBACK(name) \
    int name(void* data, int argc, \
    char** argv, char** column_name)

#define EXECUTE_SELECT_SQL(db, query, callback, data) \
    do { \
        char* sql = query; \
        char* error_message = NULL; \
        int rc; \
        \
        rc = sqlite3_exec(db, sql, callback, \
            data, &error_message); \
        \
        if (rc != SQLITE_OK) { \
          fprintf(stderr, "SQL error: %s\n", error_message); \
          sqlite3_free(error_message); \
        } \
    } while (0)
