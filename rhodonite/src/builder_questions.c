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
#include <sqlite3.h>
#include <cjson/cJSON.h>
#include <string.h>

#include <tpool.h>

#define CNHASH_IMPLEMENTATION
#include <cnhash.h>

#include "project.h"
#include "fs.h"
#include "sql_help.h"
#include "builder_questions.h"
#include "builder.h"

DEFINE_SELECT_SQL_CALLBACK(possible_answer_callback) {
    cJSON* possible_answers = (cJSON*) data;
    for (int i = 0; i < argc; i++) {
        if (!strcmp("answer_text", column_name[i])) {
            cJSON_AddItemToArray(possible_answers, cJSON_CreateString(argv[i]));
        }
    }
    return 0;
}

DEFINE_SELECT_SQL_CALLBACK(correct_answer_callback) {
    cJSON* correct_answers = (cJSON*) data;
    for (int i = 0; i < argc; i++) {
        if (!strcmp("answer_id", column_name[i])) {
           cJSON_AddItemToArray(correct_answers, cJSON_CreateNumber(atoi(argv[i])));
        }
    }
    return 0;
}

void thread_builder_question(void* question_ptr) {
    struct Question* question = (struct Question*)question_ptr;
    cJSON* question_json = cJSON_CreateObject();
    size_t question_saveas_size = 30 + strlen(question->language) + strlen(question->category) + get_int_len(question->id);
    size_t answer_saveas_size = question_saveas_size - 2;
    char* question_saveas = malloc(question_saveas_size);
    char* answer_saveas = malloc(answer_saveas_size);

    sqlite3* db;

    OPEN_SQLITE(db);

    snprintf(question_saveas, question_saveas_size, "./artifacts/questions/%s_%s_%d.json",
        question->language, question->category, question->relative_id);
    snprintf(answer_saveas, answer_saveas_size, "./artifacts/answers/%s_%s_%d.json",
        question->language, question->category, question->relative_id);

    cJSON_AddItemToObject(question_json, "q", cJSON_CreateString(question->question_text));

    if (question->image_id != -1) {
        int image_query_len = 71 + get_int_len(question->image_id);
        char* image_query = malloc(image_query_len);
        snprintf(image_query, image_query_len,
            "select height, width, mimetype from images where image_id = %d", question->image_id);

        EXECUTE_SELECT_SQL(
            db,
            image_query,
            image_metadata_callback,
            (void*) question
        );

        free(image_query);

        int alt_query_len = 72 + get_int_len(question->image_id) + strlen(question->language);
        char* alt_query = malloc(alt_query_len);
        snprintf(alt_query, alt_query_len,
            "select alt_text from image_alt_text where image_id = %d and language = '%s'",
            question->image_id, question->language);

        EXECUTE_SELECT_SQL(
            db,
            alt_query,
            image_alt_callback,
            (void*) question
        );

        free(alt_query);

        cJSON_AddItemToObject(question_json, "i", cJSON_CreateNumber(question->image_id));
        cJSON* sizes_array = cJSON_CreateArray();
        cJSON* formats_array = cJSON_CreateArray();
        for (int i = 0; i < 4; i++) {
            if (question->sizes[i]) {
                cJSON_AddItemToArray(sizes_array, cJSON_CreateString(i == 0 ? "sm" : i == 1 ? "md" : i == 2 ? "lg" : i == 3 ? "orig" : NULL));
            }
        }

        cJSON_AddItemToArray(formats_array, cJSON_CreateString("webp"));

        if (strcmp("webp", question->extension)) {
            cJSON_AddItemToArray(formats_array, cJSON_CreateString(question->extension));
        }

        cJSON_AddItemToObject(question_json, "is", sizes_array);
        cJSON_AddItemToObject(question_json, "if", formats_array);

        if (question->alt_text) {
            cJSON_AddItemToObject(question_json, "alt", cJSON_CreateString(question->alt_text));
        }
    }

    cJSON* possible_answers = cJSON_CreateArray();
    size_t possible_answer_query_len = 100 + get_int_len(question->id);
    char* possible_answer_query = malloc(possible_answer_query_len);

    snprintf(possible_answer_query, possible_answer_query_len,
        "select answer_text, answer_order from possible_answers where question_id=%d order by answer_order asc",
        question->id);

    EXECUTE_SELECT_SQL(
        db,
        possible_answer_query,
        possible_answer_callback,
        (void*) possible_answers
    );

    cJSON_AddItemToObject(question_json, "a", possible_answers);
    free(possible_answer_query);

    cJSON* correct_answers = cJSON_CreateArray();
    size_t correct_answer_query_len = 80 + get_int_len(question->id);
    char* correct_answer_query = malloc(correct_answer_query_len);
    snprintf(correct_answer_query, correct_answer_query_len,
        "select answer_id from correct_answers where question_id=%d order by answer_id asc",
        question->id);

    EXECUTE_SELECT_SQL(
        db,
        correct_answer_query,
        correct_answer_callback,
        (void*) correct_answers
    );

    free(correct_answer_query);

    char* question_print = cJSON_PrintUnformatted(question_json);
    char* answer_print = cJSON_PrintUnformatted(correct_answers);

    write_file(question_saveas, question_print);
    write_file(answer_saveas, answer_print);

    free(question_saveas);
    free(answer_saveas);
    free(question_print);
    free(answer_print);
    free(question->language);
    free(question->category);
    free(question->question_text);
    free(question->alt_text);
    free(question->sizes);
    free(question->extension);
    cJSON_Delete(question_json);
    cJSON_Delete(correct_answers);
    sqlite3_close(db);
    return;
}

bool* image_sizes_qualifiers(int width, int height) {
    bool* output = malloc(4 * sizeof(bool));

    for (int i = 0; i < 3; i++) {
        output[i] = false;
    }

    if (width > MAXIMUM_SM_IMG_DIMENSIONS.width || height > MAXIMUM_SM_IMG_DIMENSIONS.height) {
        output[0] = true;
    }

    if (width > MAXIMUM_MD_IMG_DIMENSIONS.width || height > MAXIMUM_MD_IMG_DIMENSIONS.height) {
        output[1] = true;
    }

    if (width > MAXIMUM_LG_IMG_DIMENSIONS.width || height > MAXIMUM_LG_IMG_DIMENSIONS.height) {
        output[2] = true;
    }

    output[3] = true;
    return output;
}

DEFINE_SELECT_SQL_CALLBACK(image_metadata_callback) {
    struct Question* question = (struct Question*)data;

    int image_height = 0;
    int image_width = 0;

    for (int i = 0; i < argc; i++) {
        if (!strcmp("height", column_name[i])) {
            image_height = atoi(argv[i]);
        } else if (!strcmp("width", column_name[i])) {
            image_width = atoi(argv[i]);
        } else if (!strcmp("mimetype", column_name[i])) {
            char* extension = strtok(argv[i], "/");
            extension = strtok(NULL, "/");
            question->extension = malloc(strlen(extension) + 1);
            strcpy(question->extension, extension);
        }
    }

    question->sizes = image_sizes_qualifiers(image_width, image_height);
    return 0;
}

DEFINE_SELECT_SQL_CALLBACK(image_alt_callback) {
    struct Question* question = (struct Question*)data;

    for (int i = 0; i < argc; i++) {
        if (!strcmp("alt_text", column_name[i])) {
            question->alt_text = malloc(strlen(argv[i]) + 1);
            strcpy(question->alt_text, argv[i]);
        }
    }

    return 0;
}

DEFINE_SELECT_SQL_CALLBACK(question_callback) {
    struct Question question;

    for (int i = 0; i < argc; i++) {
        if (!strcmp("id", column_name[i])) {
            question.id = atoi(argv[i]);
        } else if (!strcmp("language", column_name[i])) {
            question.language = malloc(strlen(argv[i]) + 1);
            strcpy(question.language, argv[i]);
        } else if (!strcmp("category", column_name[i])) {
            question.category = malloc(strlen(argv[i]) + 1);
            strcpy(question.category, argv[i]);
        } else if (!strcmp("question_text", column_name[i])) {
            question.question_text = malloc(strlen(argv[i]) + 1);
            strcpy(question.question_text, argv[i]);
        } else if (!strcmp("image_id", column_name[i])) {
            if (argv[i] == NULL) {
                question.image_id = -1;
            } else {
                question.image_id = atoi(argv[i]);
            }
        }
    }

    char* key = malloc(strlen(question.language) + strlen(question.category) + 1);
    strcat(key, question.language);
    strcat(key, question.category);
    int* rel_cnt = (int*)(CNHashGetValue((cnhashtable*)(((struct QuestionCallbackPassthrough*)data)->counts_table), key));
    free(key);
    question.relative_id = *rel_cnt;
    (*rel_cnt)++;

    ((struct QuestionCallbackPassthrough*)data)->questions[
        ((struct QuestionCallbackPassthrough*)data)->question_iterator] = question;

    ((struct QuestionCallbackPassthrough*)data)->question_iterator++;

    return 0;
}

struct LangCatCallback {
    char** data;
    int* count;
};

DEFINE_SELECT_SQL_CALLBACK(get_languages_callback) {
    char** languages = (char**)(((struct LangCatCallback*)data)->data);
    int* count = (int*)(((struct LangCatCallback*)data)->count);
    (*count)++;
    if (!strcmp("language_code", column_name[0])) {
        int lang_len = strlen(argv[0]);
        languages = realloc(languages, *count * sizeof(char**));
        languages[*count - 1] = malloc(lang_len + 1);
        strcpy(languages[*count - 1], argv[0]);
    }

    ((struct LangCatCallback*)data)->data = languages;

    return 0;
}

DEFINE_SELECT_SQL_CALLBACK(get_categories_callback) {
    char** categories = (char**)(((struct LangCatCallback*)data)->data);
    int* count = (int*)(((struct LangCatCallback*)data)->count);
    (*count)++;
    if (!strcmp("name", column_name[0])) {
        int cat_len = strlen(argv[0]);
        categories = realloc(categories, *count * sizeof(char**));
        categories[*count - 1] = malloc(cat_len + 1);
        strcpy(categories[*count - 1], argv[0]);
    }

    ((struct LangCatCallback*)data)->data = categories;

    return 0;
}


void build_questions_entry(void) {
    // Single threaded part - gathering all questions.
    sqlite3* db;

    OPEN_SQLITE(db);

    int lang_count = 0;
    int cat_count = 0;
    struct LangCatCallback language_data = {NULL, &lang_count};
    struct LangCatCallback category_data = {NULL, &cat_count};

    EXECUTE_SELECT_SQL(
        db,
        "select language_code from languages",
        get_languages_callback,
        (void*) &language_data
    );

    EXECUTE_SELECT_SQL(
        db,
        "select name from category",
        get_categories_callback,
        (void*) &category_data
    );

    char** languages = language_data.data;
    char** categories = category_data.data;

    /**
     * This is a char* => int* hashtable.
     * It allows to make a relative ID for a question.
     * Take two questions: (id=0, lang=en, cat=b) and (id=1, lang=en, cat=c)
     * Their relative IDs will be 0, as they are in different categories and/or languages.
     * So it can be imagined that (id=0 relid=[enb]0) (id=1 relid=[enc]0)
     *
     * cnhashtable is not threadsafe, ;-;
     * however reading appears to be threadsafe-*enough* :D
     */
    cnhashtable* counts_table = CNHashGenerate(0, 0, cnhash_strkf, cnhash_strhf, cnhash_strcf, cnhash_strdel);

    for (int i = 0; i < lang_count; i++) {
        for (int j = 0; j < cat_count; j++) {
            char* keyval = malloc(strlen(languages[i]) + strlen(categories[j]) + 1);
            int* counter = malloc(sizeof(int));
            strcat(keyval, languages[i]);
            strcat(keyval, categories[j]);
            CNHashInsert(counts_table, keyval, counter);
        }
    }

    for (int i = 0; i < lang_count; i++) {
        free(languages[i]);
    }

    for (int i = 0; i < cat_count; i++) {
        free(categories[i]);
    }

    free(languages);
    free(categories);

    int question_count = 0;
    int question_iterator = 0;

    EXECUTE_SELECT_SQL(
        db,
        "select count(id) from questions",
        counter_callback,
        (void*) &question_count
    );

    // All questions are loaded into memory.
    // Maybe some pagination possible here?
    struct Question* questions = calloc(question_count, sizeof(struct Question));

    struct QuestionCallbackPassthrough passthrough = {
        db,
        questions,
        question_count,
        question_iterator,
        counts_table
    };

    EXECUTE_SELECT_SQL(
        db,
        "select * from questions",
        question_callback,
        (void*) &passthrough
    );

    // End of single threaded.
    // Now each question gets its own thread.

    tpool_t* thread_pool;
    thread_pool = tpool_create(THREAD_COUNT);

    for (int i = 0; i < question_count; i++) {
        tpool_add_work(thread_pool,
            thread_builder_question, &questions[i]);
    }

    tpool_wait(thread_pool);

    CNHashDestroy(counts_table);
    tpool_destroy(thread_pool);
    sqlite3_close(db);
    return;
}
