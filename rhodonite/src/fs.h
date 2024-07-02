/**
 * Copyright (C) zxyz 2024
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

#pragma once

#include <stddef.h>
#include <stdbool.h>
#include <ftw.h>

void write_file(char* filename, char* contents);

void* read_file(char* filename, size_t* len);

void* read_file(char* filename, size_t* len);

int unlink_cb(const char* fpath, const struct stat* sb, int typeflag, struct FTW* ftwbuf);

int rmrf(char* path);

void make_directory(char* filename);

bool file_exists(char* filename);

