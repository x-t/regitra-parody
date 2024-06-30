/**
 * Copyright (C) zxyz 2024
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

#pragma once

#include <sqlite3.h>
#include <stdbool.h>
#include "sql_help.h"

DEFINE_SELECT_SQL_CALLBACK(possible_answer_callback);
DEFINE_SELECT_SQL_CALLBACK(correct_answer_callback);
void thread_builder_question(void* question_ptr);
DEFINE_SELECT_SQL_CALLBACK(image_metadata_callback);
DEFINE_SELECT_SQL_CALLBACK(image_alt_callback);
DEFINE_SELECT_SQL_CALLBACK(question_callback);
bool* image_sizes_qualifiers(int width, int height);
void build_questions_entry(void);
