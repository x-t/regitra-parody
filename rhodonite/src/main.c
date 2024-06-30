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
#include <vips/vips.h>

#include "sql_help.h"
#include "project.h"
#include "fs.h"
#include "entrypoints.h"

void make_directory_structure(void) {
    make_directory("./artifacts");
    make_directory("./artifacts/questions");
    make_directory("./artifacts/answers");
    make_directory("./artifacts/img");
    return;
}

int get_int_len(int value) {
    int l = 1;
    while (value > 9) {
	l++;
	value /= 10;
    }
    return l;
}

void build_main(void) {
    // FIXME check for version requirement

    make_directory_structure();

    build_unified_metadata_entry();
    build_images_entry();
    build_questions_entry();

    return;
}

int main(int argc, char* argv[]) {
    // FIXME command line options
    VIPS_INIT(argv[0]);

    build_main();

    vips_shutdown();
    return 0;
}
