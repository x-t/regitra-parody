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
#include <stdbool.h>
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

    if (!file_exists(DB_NAME)) {
        fprintf(stderr, "Database %s doesn't exist. Exiting.\n", DB_NAME);
        exit(1);
    }

    fprintf(stderr, "Starting build (database: %s, threads: %d)...\n", DB_NAME, THREAD_COUNT);

    make_directory_structure();

    if (!cmd_opts->skip_metadata_build) {
        build_unified_metadata_entry();
    }

    if (!cmd_opts->skip_images_build) {
        build_images_entry();
    }

    if (!cmd_opts->skip_questions_build) {
        build_questions_entry();
    }

    return;
}

struct CommandLineOptions* cmd_opts = NULL;

void print_build_help(char** argv) {
    fprintf(stderr,
        "rhodonite - build\n"
        "The build step for the regitra-parody CMS.\n"
        "\n"
        "Usage:     %s build (args...)\n"
        "\n"
        "Arguments:\n"
        "       -t [n]          Amount of threads to use (default: %d)\n"
        "       -i [s]          Database file to use (default: %s)\n"
        "       -s [s]          Skip a step. Can be chained (ex.: -s i -s q)\n"
        "           i           Skips image build\n"
        "           q           Skips question build\n"
        "           m           Skips metadata build\n"
        "       -r              Deletes the ./artifacts folder before building\n",
        argv[0], DEFAULT_THREAD_COUNT, DEFAULT_DB_NAME
    );

    return;
}

void print_general_help(char** argv) {
    fprintf(stderr,
        "rhodonite\n"
        "The CMS for regitra-parody.\n"
        "\n"
        "Usage:     %s [command] (args...)\n"
        "\n"
        "Available commands:\n"
        "       help            This dialog and additional help.\n"
        "                       Use \"help [command]\" to get help for a\n"
        "                       particular command. (ex.: help build)\n"
        "       build           Builds the site from a database file to ./artifacts\n"
        "\n"
        ">>> No warranties. If your computer explodes it is not my problem :D\n",
        argv[0]
    );

    return;
}

void begin(int argc, char** argv) {
    if (argc == 1) {
        print_general_help(argv);
        return;
    }

    cmd_opts = malloc(sizeof(struct CommandLineOptions));
    cmd_opts->custom_database = false;
    cmd_opts->custom_threads = false;
    cmd_opts->skip_images_build = false;
    cmd_opts->skip_questions_build = false;
    cmd_opts->skip_metadata_build = false;

    if (!strcmp("help", argv[1])) {
        if (argc == 2 || argc > 3) {
            goto print_help;
        }

        if (!strcmp("build", argv[2])) {
            print_build_help(argv);
        } else {
            goto print_help;
        }

        goto end;
    }

    if (!strcmp("build", argv[1])) {
        if (argc > 2) {
            for (int i = 2; i < argc; i++) {
                if (!strcmp("-t", argv[i])) {
                    if (++i >= argc) {
                        print_build_help(argv);
                        goto end;
                    }
                    int custom_threads = atoi(argv[i]);
                    if (custom_threads < 1) {
                        print_build_help(argv);
                        goto end;
                    }
                    cmd_opts->custom_threads = true;
                    cmd_opts->thread_amount = custom_threads;
                } else if (!strcmp("-i", argv[i])) {
                    if (++i >= argc) {
                        print_build_help(argv);
                        goto end;
                    }
                    cmd_opts->custom_database = true;
                    cmd_opts->database_name = malloc(strlen(argv[i]) + 1);
                    strcpy(cmd_opts->database_name, argv[i]);
                } else if (!strcmp("-s", argv[i])) {
                    if (++i >= argc) {
                        print_build_help(argv);
                        goto end;
                    }
                    if (!strcmp("i", argv[i])) {
                        cmd_opts->skip_images_build = true;
                    } else if (!strcmp("q", argv[i])) {
                        cmd_opts->skip_questions_build = true;
                    } else if (!strcmp("m", argv[i])) {
                        cmd_opts->skip_metadata_build = true;
                    } else {
                        print_build_help(argv);
                        goto end;
                    }
                } else if (!strcmp("-r", argv[i])) {
                    rmrf("./artifacts");
                }
            }
        }

        build_main();
        goto end;
    }


print_help:
    print_general_help(argv);
end:
    free(cmd_opts);

    if (cmd_opts->custom_database) {
        free(cmd_opts->database_name);
    }

    return;
}

int main(int argc, char** argv) {
    VIPS_INIT(argv[0]);
    begin(argc, argv);
    vips_shutdown();
    return 0;
}
