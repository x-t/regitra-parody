mod errors;
mod get_answers;
mod get_questions;
use get_answers::get_answers;
use get_questions::get_questions;
use std::collections::HashMap;
use std::env;
use std::net::Ipv4Addr;
use warp::Filter;

#[tokio::main]
async fn main() {
    let answers_api = warp::post()
        .and(warp::path("api"))
        .and(warp::path("get_answers"))
        .and(warp::body::content_length_limit(1024 * 16))
        .and(warp::body::json())
        .and(warp::query::<HashMap<String, String>>())
        .and_then(move |x: Vec<i32>, y: HashMap<String, String>| async move {
            get_answers(x, y)
                .await
                .and_then(|res| Ok(res))
                .or_else(|_| Err(warp::reject::not_found()))
        });

    let questions_api = warp::get()
        .and(warp::path("api"))
        .and(warp::path("get_questions"))
        .and(warp::query::<HashMap<String, String>>())
        .and_then(move |x: HashMap<String, String>| async move {
            get_questions(x)
                .await
                .and_then(|res| Ok(res))
                .or_else(|_| Err(warp::reject::not_found()))
        });

    let port_key = "FUNCTIONS_CUSTOMHANDLER_PORT";
    let port: u16 = match env::var(port_key) {
        Ok(val) => val.parse().expect("Custom Handler port is not a number!"),
        Err(_) => 3000,
    };

    warp::serve(questions_api.or(answers_api))
        .run((Ipv4Addr::UNSPECIFIED, port))
        .await
}
