#[path = "errors.rs"]
mod errors;
#[path = "make_sheet_hub.rs"]
mod make_sheet_hub;
use make_sheet_hub::make_sheet_hub;
use rand::{seq::SliceRandom, thread_rng, Rng};
use serde::{Deserialize, Serialize};
use serde_json;
use std::collections::HashMap;
use warp::{http::Response, http::Result, Reply};

#[derive(Serialize, Deserialize)]
struct Question {
    id: usize,
    q: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    image: Option<String>,
    answers: Vec<String>,
}

impl Question {
    fn new(row: Vec<String>, id: usize) -> Question {
        Question {
            id: id,
            q: (*row[0]).to_string(),
            answers: serde_json::from_str(&row[3]).unwrap(),
            image: if row[1] == "" {
                None
            } else {
                Some((*row[1]).to_string())
            },
        }
    }
}

pub async fn get_questions(q: HashMap<String, String>) -> Result<impl Reply> {
    let language;

    match q.get("lang") {
        Some(lang) => language = lang,
        None => return errors::bad_request(),
    }

    if language != "en" && language != "lt" {
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
            &format!("Q_{}!A2", language.to_uppercase()),
        )
        .major_dimension("ROWS")
        .doit()
        .await;

    let questions_result = match res {
        Ok(v) => match v.1.values {
            Some(values) => values,
            None => return errors::internal_server_error(),
        },
        Err(_) => return errors::internal_server_error(),
    };

    let amount_of_questions = &questions_result[0][0].parse::<i32>().unwrap();

    // To save on API calls, instead of generating random IDs, we'll make
    // a random range, then just shuffle the questions around.
    //
    // min = 2, max = amount_of_questions + 2 - 30
    // idx_start = rand(min, max), idx_end = idx_start + 29
    //
    // This ends up in a range "Q_EN!C{idx_start}:F{idx_end}"
    // ex. 30 questions, start = 2, end = 31, range = "Q_EN!C2:F31"

    let range_start = thread_rng().gen_range(2..=(amount_of_questions + 2 - 30)) as usize;
    let res = hub
        .spreadsheets()
        .values_get(
            &spreadsheet_id,
            &format!(
                "Q_{}!C{}:F{}",
                language.to_uppercase(),
                range_start,
                range_start + 29
            ),
        )
        .major_dimension("ROWS")
        .doit()
        .await;

    let questions_result = match res {
        Ok(v) => match v.1.values {
            Some(values) => values,
            None => return errors::internal_server_error(),
        },
        Err(_) => return errors::internal_server_error(),
    };

    if questions_result.len() != 30 {
        return errors::internal_server_error();
    }

    let mut questions: Vec<Question> = vec![];

    for (i, quest) in questions_result.iter().enumerate() {
        let q = Question::new(quest.to_vec(), i + range_start);
        questions.push(q);
    }

    questions.shuffle(&mut thread_rng());

    Response::builder()
        .status(200)
        .header("Content-Type", "application/json")
        .body(serde_json::json!(questions).to_string())
}
