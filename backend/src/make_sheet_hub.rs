#[path = "errors.rs"]
mod errors;
extern crate google_sheets4 as sheets4;
extern crate hyper_rustls;
extern crate yup_oauth2 as oauth2;
use hyper;
use std::env;
use std::result::Result;
use warp::http::Response;

pub async fn make_sheet_hub(
) -> Result<(String, sheets4::Sheets), warp::http::Result<Response<std::string::String>>> {
    let spreadsheet_id = match env::var("GOOGLE_SPREADSHEET_ID") {
        Ok(val) => val,
        Err(_) => return Err(errors::internal_server_error()),
    };

    let client_secret = oauth2::read_service_account_key("./key.json")
        .await
        .unwrap();

    let auth = oauth2::ServiceAccountAuthenticator::builder(client_secret)
        .build()
        .await
        .unwrap();

    Ok((
        spreadsheet_id,
        sheets4::Sheets::new(
            hyper::Client::builder().build(hyper_rustls::HttpsConnector::with_native_roots()),
            auth,
        ),
    ))
}
