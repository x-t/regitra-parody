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
#include <vips/vips.h>

#include <tpool.h>
#include <base64.h>

#include "project.h"
#include "fs.h"
#include "sql_help.h"
#include "builder_images.h"
#include "builder.h"

struct ImageDimensions resize_calc(int width, int height, int max_width, int max_height) {
    double aspect_ratio_per_width = (double)max_width / (double)width;
    double aspect_ratio_per_height = (double)max_height / (double)height;
    double aspect_ratio_usable = 0.0;

    // Technically, should be min(1, per_width, per_height);
    // However, this function is only called when a resize
    // is required (w>mw || h>mh), thus resizing with a
    // factor of 1 is not needed.
    if (aspect_ratio_per_width > aspect_ratio_per_height) {
	aspect_ratio_usable = aspect_ratio_per_height;
    } else if (aspect_ratio_per_height > aspect_ratio_per_width) {
	aspect_ratio_usable = aspect_ratio_per_width;
    }

    struct ImageDimensions dimensions = (struct ImageDimensions) {
	aspect_ratio_usable * height,
	aspect_ratio_usable * width
    };

    // This is here for debugging purposes.
    // I left it in because - I mean. Look at it.
    // What a beauty.
    // printf("ow=%d oh=%d mw=%d mh=%d r1=%f r2=%f dr=%f width=%f (%d) height=%f (%d)\n", width, height, max_width, max_height, aspect_ratio_per_width, aspect_ratio_per_height, aspect_ratio_usable, aspect_ratio_usable * width, dimensions.width, aspect_ratio_usable * height, dimensions.height);

    return dimensions;
}


struct ImageDimensions* image_sizes_calculator(int width, int height) {
    struct ImageDimensions sm_dims = {0, 0}, md_dims = {0, 0},
			 lg_dims = {0, 0}, orig_dims = {0, 0};

    if (width > MAXIMUM_SM_IMG_DIMENSIONS.width || height > MAXIMUM_SM_IMG_DIMENSIONS.height) {
	sm_dims = resize_calc(width, height, MAXIMUM_SM_IMG_DIMENSIONS.width, MAXIMUM_SM_IMG_DIMENSIONS.height);
    }

    if (width > MAXIMUM_MD_IMG_DIMENSIONS.width || height > MAXIMUM_MD_IMG_DIMENSIONS.height) {
	md_dims = resize_calc(width, height, MAXIMUM_MD_IMG_DIMENSIONS.width, MAXIMUM_MD_IMG_DIMENSIONS.height);
    }

    if (width > MAXIMUM_LG_IMG_DIMENSIONS.width || height > MAXIMUM_LG_IMG_DIMENSIONS.height) {
	lg_dims = resize_calc(width, height, MAXIMUM_LG_IMG_DIMENSIONS.width, MAXIMUM_LG_IMG_DIMENSIONS.height);
    }

    if (width > MAXIMUM_ORIG_IMG_DIMENSIONS.width || height > MAXIMUM_ORIG_IMG_DIMENSIONS.height) {
	orig_dims = resize_calc(width, height, MAXIMUM_ORIG_IMG_DIMENSIONS.width, MAXIMUM_ORIG_IMG_DIMENSIONS.height);
    }

    struct ImageDimensions* output = calloc(4, sizeof(struct ImageDimensions));
    output[0] = sm_dims;
    output[1] = md_dims;
    output[2] = lg_dims;
    output[3] = orig_dims;

    return output;
}

char* get_dimension_name(int i) {
    switch (i) {
	case 0:
	    return "sm";
	case 1:
	    return "md";
	case 2:
	    return "lg";
	case 3:
	    return "orig";
    }

    return NULL;
}

void thread_builder_image(void* image_ptr) {
    struct Image* image = (struct Image*)image_ptr;
    struct ImageDimensions* resize_dimensions = image_sizes_calculator(image->width, image->height);

    for (int i = 0; i < 4; i++) {
	struct ImageDimensions dimension_size = resize_dimensions[i];
	bool need_to_resize = false;
	if (dimension_size.width != 0 && dimension_size.height != 0) {
	    need_to_resize = true;
	}

	if (!need_to_resize && i != 3) {
	    continue;
	}

	char* dimension_name = get_dimension_name(i);
	size_t filename_len = get_int_len(image->image_id) + strlen(dimension_name) + 3;
	char* filename = malloc(filename_len - 1);
	size_t orig_filename_len = filename_len + strlen(image->mimetype), filename_webp_len = filename_len + 4;
	char* orig_filename = malloc(orig_filename_len);
	char* filename_webp = malloc(filename_webp_len);
	snprintf(filename, filename_len, "%d-%s.", image->image_id, dimension_name);
	strcat(orig_filename, filename);
	strcat(filename_webp, filename);
	strcat(orig_filename, image->mimetype);
	strcat(filename_webp, "webp");

	size_t image_path_len = 16 + orig_filename_len;
	size_t webp_image_path_len = 16 + filename_webp_len;
	char* image_path = malloc(image_path_len);
	char* webp_image_path = malloc(webp_image_path_len);
	strcat(image_path, "./artifacts/img/");
	strcat(image_path, orig_filename);
	strcat(webp_image_path, "./artifacts/img/");
	strcat(webp_image_path, filename_webp);

	if (need_to_resize) {
	    // This isn't the fastest ;-;
	    VipsImage* resized_image;
	    vips_thumbnail_buffer(image->data,
		image->data_size,
		&resized_image,
		dimension_size.width,
		"height", dimension_size.height,
		"option_string", !strcmp("gif", image->mimetype) ? "n=-1" : "",
		NULL
	    );


	    vips_image_write_to_file(resized_image, image_path, NULL);
	} else {
	    VipsImage* orig_image = vips_image_new_from_buffer(image->data, image->data_size, "", NULL);
	    vips_image_write_to_file(orig_image, image_path, NULL);
	}

	// If Vips doesn't reload the image again (i.e. tries to save a saved buffer
	// again, it will show
	// (process:31734): VIPS-WARNING **: 04:34:52.455: error in tile 0 x ?
	// and won't actually save the image.

	if (strcmp("webp", image->mimetype)) {
	    VipsImage* to_convert = vips_image_new_from_file(image_path, NULL);
	    vips_webpsave(to_convert, webp_image_path, NULL);
	}

	free(image_path);
	free(webp_image_path);
	free(filename);
	free(orig_filename);
	free(filename_webp);
    }

    free(image->mimetype);
    free(image->data);
    free(resize_dimensions);
    return;
}

DEFINE_SELECT_SQL_CALLBACK(images_callback) {
    struct Image image = {};

    for (int i = 0; i < argc; i++) {
        if (!strcmp("image_id", column_name[i])) {
            image.image_id = atoi(argv[i]);
        } else if (!strcmp("data", column_name[i])) {
	    // This is a buffer, not a string, therefore no null-terminator.
            int out_size = b64_decoded_size(argv[i]);
            image.data = malloc(out_size);

            if (!b64_decode(argv[i], (unsigned char*) image.data, out_size)) {
                fputs("Couldn't decode image.\n", stderr);
                exit(2);
            }

	    image.data_size = out_size;
        } else if (!strcmp("height", column_name[i])) {
            image.height = atoi(argv[i]);
        } else if (!strcmp("width", column_name[i])) {
            image.width = atoi(argv[i]);
        } else if (!strcmp("mimetype", column_name[i])) {
	    // strtok isn't thread-safe? Huh?
	    char* extension = strtok(argv[i], "/");
	    extension = strtok(NULL, "/");
            image.mimetype = malloc(strlen(extension) + 1);
            strcpy(image.mimetype, extension);
        }
    }

    ((struct ImageCallbackPassthrough*)data)->images[
        ((struct ImageCallbackPassthrough*)data)->image_iterator] = image;

    ((struct ImageCallbackPassthrough*)data)->image_iterator++;

    return 0;
}

void build_images_entry(void) {
    sqlite3* db;
    tpool_t* thread_pool;

    thread_pool = tpool_create(THREAD_COUNT);
    OPEN_SQLITE(db);

    int images_count = 0;
    int image_iterator = 0;

    EXECUTE_SELECT_SQL(
        db,
        "select count(image_id) from images",
        counter_callback,
        (void*) &images_count
    );

    struct Image* images = calloc(images_count, sizeof(struct Image));

    struct ImageCallbackPassthrough passthrough = {
        db,
        images,
        images_count,
        image_iterator
    };

    EXECUTE_SELECT_SQL(
        db,
        "select * from images",
        images_callback,
        (void*) &passthrough
    );

    for (int i = 0; i < images_count; i++) {
        tpool_add_work(thread_pool,
            thread_builder_image, &images[i]);
    }

    tpool_wait(thread_pool);

    free(images);
    tpool_destroy(thread_pool);
    sqlite3_close(db);
    return;
}
