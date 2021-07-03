use warp::{http::Response, http::Result};

#[allow(dead_code)]
pub fn bad_request() -> Result<Response<std::string::String>> {
    Response::builder()
        .status(400)
        .body(String::from("400 Bad Request"))
}

#[allow(dead_code)]
pub fn internal_server_error() -> Result<Response<std::string::String>> {
    Response::builder()
        .status(500)
        .body(String::from("500 Internal Server Error"))
}
