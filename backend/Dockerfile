FROM rust:latest as builder
WORKDIR /usr/src/handler
COPY . .
RUN cargo install --path .

FROM debian:bullseye-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
RUN update-ca-certificates
COPY --from=builder /usr/local/cargo/bin/handler /handler
COPY --from=builder /usr/src/handler/key.json /key.json
CMD ["/handler"]