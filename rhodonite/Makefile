#
# Copyright (C) zxyz 2024
# This Source Code Form is subject to the terms
# of the Mozilla Public License, v. 2.0. If a
# copy of the MPL was not distributed with this
# file, You can obtain one at https://mozilla.org/MPL/2.0/.
#

.DEFAULT_GOAL := build

SOURCE_FILES = src/builder.c src/builder_metadata.c src/builder_questions.c src/builder_images.c src/main.c src/fs.c
LIBRARY_FILES = lib/tpool.c lib/base64.c
BINARY_NAME = rhodonite

CC ?= clang
CFLAGS_SECURITY = -D_FORTIFY_SOURCE=2 -fstack-protector-all
CFLAGS ?= -O3 -march=native -mtune=native -DHASHNODEBUG
DEV_CFLAGS ?= -O0 -g
WARNINGS ?= -Wall -Wextra -pedantic -Wno-unused-parameter
LFLAGS ?= -l sqlite3 -l cjson -l c -l pthread $(shell pkg-config vips --cflags --libs)

build: clean
	$(CC) -o $(BINARY_NAME) $(SOURCE_FILES) $(LIBRARY_FILES) -I ./lib $(CFLAGS) $(CFLAGS_SECURITY) $(WARNINGS) $(LFLAGS)

dev: clean
	$(CC) -o $(BINARY_NAME)-dev $(SOURCE_FILES) $(LIBRARY_FILES) -I ./lib $(DEV_CFLAGS) $(CFLAGS_SECURITY) $(WARNINGS) $(LFLAGS)

clean:
	rm -rf ./rhodonite-dev.dSYM
	rm -rf ./rhodonite-dev
	rm -rf ./rhodonite

