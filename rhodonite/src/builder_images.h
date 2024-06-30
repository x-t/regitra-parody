/**
 * Copyright (C) zxyz 2024
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

#pragma once

#include <sqlite3.h>
#include "sql_help.h"
#include "project.h"

struct ImageDimensions resize_calc(int width, int height, int max_width, int max_height);
struct ImageDimensions* image_sizes_calculator(int width, int height);
void thread_builder_image(void* image);
DEFINE_SELECT_SQL_CALLBACK(images_callback);
void build_images_entry(void);

