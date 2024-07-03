# Copyright (C) zxyz 2024
# This Source Code Form is subject to the terms
# of the Mozilla Public License, v. 2.0. If a
# copy of the MPL was not distributed with this
# file, You can obtain one at https://mozilla.org/MPL/2.0/.

FROM debian:latest AS deps

RUN apt-get update

RUN apt-get install -y clang \
	libsqlite3-dev libcjson-dev \
	libvips-dev make

# ---

FROM deps as build

WORKDIR /app

ADD ./src ./src
ADD ./lib ./lib
ADD Makefile Makefile

RUN make

# ---

FROM debian:latest AS production-deps

RUN apt-get update

RUN apt-get install -y sqlite3 libcjson1 libvips

WORKDIR /app

COPY --from=build /app/rhodonite /app/rhodonite

ENTRYPOINT ["/app/rhodonite"]

