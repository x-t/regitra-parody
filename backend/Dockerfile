FROM rust:latest as builder
WORKDIR /usr/src/handler
COPY . .
RUN cargo install --path .

FROM debian:bullseye-slim
COPY --from=builder /usr/local/cargo/bin/handler /handler
COPY --from=builder /usr/src/handler/key.json /key.json
CMD ["/handler"]