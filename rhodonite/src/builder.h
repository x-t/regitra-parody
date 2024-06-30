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

DEFINE_SELECT_SQL_CALLBACK(counter_callback);

const struct ImageDimensions MAXIMUM_SM_IMG_DIMENSIONS;
const struct ImageDimensions MAXIMUM_MD_IMG_DIMENSIONS;
const struct ImageDimensions MAXIMUM_LG_IMG_DIMENSIONS;
const struct ImageDimensions MAXIMUM_ORIG_IMG_DIMENSIONS;
