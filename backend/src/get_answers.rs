#[path = "errors.rs"]
mod errors;
#[path = "make_sheet_hub.rs"]
mod make_sheet_hub;
use make_sheet_hub::make_sheet_hub;
use rand::{seq::SliceRandom, thread_rng};
use serde::{Deserialize, Serialize};
use serde_json;
use std::collections::HashMap;
use warp::{http::Response, http::Result};

#[derive(Serialize, Deserialize)]
struct Answer {
    id: usize,
    correct: Vec<i32>,
}

impl Answer {
    fn new(row: Vec<String>, id: usize) -> Answer {
        Answer {
            id: id,
            correct: serde_json::from_str(&row[0]).unwrap(),
        }
    }
}

pub async fn get_answers(
    q_ids: Vec<i32>,
    query: HashMap<String, String>,
) -> Result<Response<std::string::String>> {
    if q_ids.len() != 30 {
        return errors::bad_request();
    }

    let language;

    match query.get("lang") {
        Some(lang) => language = lang,
        None => return errors::bad_request(),
    }

    if language != "en" && language != "lt" {
        return errors::bad_request();
    }

    let min = *q_ids.iter().min().unwrap() as usize;
    let max = *q_ids.iter().max().unwrap() as usize;

    if max - min != 29 {
        return errors::bad_request();
    }

    let (spreadsheet_id, hub) = match make_sheet_hub().await {
        Ok(h) => h,
        Err(e) => return e,
    };

    let res = hub
        .spreadsheets()
        .values_get(
            &spreadsheet_id,
            &format!("Q_{}!E{}:E{}", language.to_uppercase(), min, max),
        )
        .major_dimension("ROWS")
        .doit()
        .await;

    let answers_result = match res {
        Ok(v) => match v.1.values {
            Some(values) => values,
            None => return errors::internal_server_error(),
        },
        Err(_) => return errors::internal_server_error(),
    };

    if answers_result.len() != 30 {
        return errors::internal_server_error();
    }

    let mut answers: Vec<Answer> = vec![];

    for (i, ans) in answers_result.iter().enumerate() {
        let a = Answer::new(ans.to_vec(), i + min);
        answers.push(a);
    }

    // Because I can. That's why.
    answers.shuffle(&mut thread_rng());

    Response::builder()
        .status(200)
        .header("Content-Type", "application/json")
        .body(serde_json::json!(answers).to_string())
}
