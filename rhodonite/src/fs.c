/**
 * Copyright (C) zxyz 2024
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

#include <stdio.h>
#include <stdbool.h>
#include <ftw.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/mman.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <stddef.h>

#include "fs.h"

void write_file(char* filename, char* contents) {
    FILE* fptr = fopen(filename, "w");

    fputs(contents, fptr);
    fclose(fptr);
    return;
}

bool file_exists(char* filename) {
    if (access(filename, F_OK) == 0) {
        return true;
    }

    return false;
}

void* read_file(char* filename, size_t* len) {
    int fd = open(filename, O_RDONLY);
    *len = lseek(fd, 0, SEEK_END);
    void* data = mmap(0, *len, PROT_READ, MAP_PRIVATE, fd, 0);
    return data;
}

void make_directory(char* filename) {
    struct stat st = {0};

    if (stat(filename, &st) == -1) {
        mkdir(filename, 0744);
    }

    return;
}

int unlink_cb(const char* fpath, const struct stat* sb, int typeflag, struct FTW* ftwbuf) {
    int rv = remove(fpath);

    if (rv)
        perror(fpath);

    return rv;
}

int rmrf(char* path) {
    return nftw(path, unlink_cb, 64, FTW_DEPTH | FTW_PHYS);
}
