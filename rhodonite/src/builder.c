/**
 * Copyright (C) zxyz 2024
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

#include <sqlite3.h>
#include <stdlib.h>
#include "sql_help.h"
#include "project.h"
#include "builder.h"

DEFINE_SELECT_SQL_CALLBACK(counter_callback) {
    *((int*) data) = atoi(argv[0]);
    return 0;
}

/**
 * Mobile: Images are viewed in max-width: 300px;max-height: 200px;
 * Desktop: Images are viewed in max-width: 400px;max-height: 300px;
 * Sizes are scaled off the desktop maximum.
 * The scales are: sm 0.75, md 1.5, lg 2.25, orig 3
 */
const struct ImageDimensions MAXIMUM_SM_IMG_DIMENSIONS = (struct ImageDimensions) {225, 300};
const struct ImageDimensions MAXIMUM_MD_IMG_DIMENSIONS = (struct ImageDimensions) {450, 600};
const struct ImageDimensions MAXIMUM_LG_IMG_DIMENSIONS = (struct ImageDimensions) {675, 900};
const struct ImageDimensions MAXIMUM_ORIG_IMG_DIMENSIONS = (struct ImageDimensions) {900, 1200};
