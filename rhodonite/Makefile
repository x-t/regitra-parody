# x-t.github.io (c) 2023
# This work is licensed under the Creative Commons
# Attribution-NonCommercial-ShareAlike 4.0 International
# License. To view a copy of this license, visit
# http://creativecommons.org/licenses/by-nc-sa/4.0/ or
# send a letter to Creative Commons, PO Box 1866,
# Mountain View, CA 94042, USA.

.DEFAULT_GOAL := build

build: clean
	clang -o rhodonite src/builder.c src/builder_metadata.c src/builder_questions.c src/builder_images.c src/main.c lib/tpool.c lib/base64.c src/fs.c -I ./lib -O3 -march=native -mtune=native -Wall -l sqlite3 -l cjson -l c -l pthread `pkg-config vips --cflags --libs` -D_FORTIFY_SOURCE=2 -fstack-protector-all

dev: clean
	clang -o rhodonite-dev src/builder.c src/builder_metadata.c src/builder_questions.c src/builder_images.c src/main.c lib/tpool.c lib/base64.c src/fs.c -I ./lib -O0 -g -Wall -l sqlite3 -l cjson -l c -l pthread `pkg-config vips --cflags --libs` -D_FORTIFY_SOURCE=2 -fstack-protector-all

clean:
	rm -rf ./rhodonite-dev.dSYM
	rm -rf ./rhodonite-dev
	rm -rf ./artifacts

