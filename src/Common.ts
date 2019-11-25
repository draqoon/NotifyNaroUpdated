import { Columns } from "./Constants";
import { HttpStatus } from "./Constants";
import { PropertyKeys } from "./Constants";
import { URLs } from "./Constants";
import { MessageText } from "./Constants";
import { Flags } from "./Constants";
import * as ExtendMethods from "./ExtendMethods";

export class Novel {
  public ncode: string;
  public NCODE: string;
  public title: string;
  public writer: string;
  public lastup: Date;
  public generalLastup: string;
  public allNo: number;
  public url: string;
  public end: number;
  public globalPoint: number;
  public monthlyPoint: number;
}

//--------------------------------------------------------------------------------------------
/**
 * 更新通知設定用のシートを取得する
 *
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
export function getSheet(userId: string = "main"): GoogleAppsScript.Spreadsheet.Sheet {
  const fileId = PropertiesService.getScriptProperties().getProperty(
    PropertyKeys.PROPERTY_SPREADSHEET_FILE_ID
  );
  const file = SpreadsheetApp.openById(fileId);
  const sheet = file.getSheets()[0];
  return sheet;
}
//--------------------------------------------------------------------------------------------
/**
 * 更新通知設定用のシートから通知対象の小説情報のリストを取得する
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @returns {Array.<Novel>}
 */
export function readNovelsFromSheet(
  sheet: GoogleAppsScript.Spreadsheet.Sheet
): Novel[] {
  const rows = sheet.getLastRow() - 1;

  if (rows === 0) return [];

  const range = sheet.getRange(2, 1, rows, Columns.COL_COUNT);
  const values = range.getValues();

  const novels = values
    .filter(row => row[Columns.COL_NCODE])
    .map(rowValues => setSheetRowToNovel(rowValues));

  return novels;
}
//--------------------------------------------------------------------------------------------
/**
 * 更新通知設定用のシートへ小説情報のリストを保存する
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {Array.<Novel>} novels
 */
export function writeNovelsToSheet(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  novels: Novel[]
) {
  novels = novels.filter(novel => novel.ncode);

  //更新日時での降順ソート
  novels.sort((x, y) => y.lastup.getTime() - x.lastup.getTime());

  const values = novels.map(novel => setNovelToSheetRow(novel));

  sheet
    .getRange(2, 1, sheet.getLastRow() - 1, Columns.COL_COUNT)
    .clearContent();

  if (values.length === 0) return;

  //シート更新
  sheet.getRange(2, 1, values.length, Columns.COL_COUNT).setValues(values);
}

//--------------------------------------------------------------------------------------------
/**
 * 小説情報１件を更新通知設定用のシート１行のデータへ変換する
 *
 * @param {Novel} novel
 * @returns {Array}
 */
function setNovelToSheetRow(novel: Novel): any[] {
  const rowValues = new Array(Columns.COL_COUNT);
  try {
    rowValues[Columns.COL_NCODE] = novel.NCODE;
    rowValues[Columns.COL_TITLE] = novel.title;
    rowValues[Columns.COL_WRITER] = novel.writer;
    rowValues[Columns.COL_LASTUP] = novel.lastup;
    rowValues[Columns.COL_ALL_NO] = novel.allNo;
    rowValues[Columns.COL_URL] =
      URLs.URL_NARO_ROOT + novel.ncode.toLowerCase() + "/" + novel.allNo + "/";
    rowValues[Columns.COL_END] = novel.end === Flags.END_CONTINUOUS ? "" : 1;
    rowValues[Columns.COL_GLOBAL_POINT] = novel.globalPoint;
    rowValues[Columns.COL_MONTHLY_POINT] = novel.monthlyPoint;
  } catch (ex) {
    console.error("novel = " + JSON.stringify(novel));
    throw new Error(ex.message);
  }
  return rowValues;
}
//--------------------------------------------------------------------------------------------
/**
 * 更新通知設定用のシート１行のデータを小説情報１件へ変換する
 *
 * @param {Array} rowValues
 * @returns {Novel}
 */
function setSheetRowToNovel(rowValues: any[]): Novel {
  const novel = new Novel();
  novel.ncode = rowValues[Columns.COL_NCODE].toLowerCase();
  novel.NCODE = rowValues[Columns.COL_NCODE].toUpperCase();
  novel.title = rowValues[Columns.COL_TITLE];
  novel.writer = rowValues[Columns.COL_WRITER];
  novel.lastup = rowValues[Columns.COL_LASTUP];
  novel.allNo = rowValues[Columns.COL_ALL_NO];
  novel.url =
    URLs.URL_NARO_ROOT + novel.ncode.toLowerCase() + "/" + novel.allNo + "/";
  novel.end =
    rowValues[Columns.COL_END] === 1
      ? Flags.END_COMPLETE
      : Flags.END_CONTINUOUS;
  novel.globalPoint = rowValues[Columns.COL_GLOBAL_POINT];
  novel.monthlyPoint = rowValues[Columns.COL_MONTHLY_POINT];
  return novel;
}
//--------------------------------------------------------------------------------------------
/**
 * 更新通知設定用のシートへ対象のNCODEの小説情報を追加登録する
 *
 * @param {string} ncode
 */
export function AddWatchNcode(ncode: string) {
  const NCODE = ncode.toUpperCase();
  const sheet = getSheet();
  const sheetNovels = readNovelsFromSheet(sheet);
  if (0 < sheetNovels.filter(novel => novel.ncode === ncode).length)
    return {
      isError: true,
      message: Utilities.formatString(
        MessageText.MSG_WARN_ALREADY_WATCHING,
        NCODE
      )
    };

  const result = fetchNaroNovels([ncode]);
  if (result.isError)
    return {
      is_error: true,
      message: MessageText.MSG_WARN_NARO_API_ERROR
    };

  const novels = result.novels.filter(novel => novel.NCODE === NCODE);

  if (novels.length === 0)
    return {
      is_error: true,
      message: Utilities.formatString(MessageText.MSG_NCODE_NOT_FOUND, NCODE)
    };

  const addingNovel = novels[0];
  if (addingNovel.end === Flags.END_COMPLETE) {
    return {
      is_error: true,
      message: Utilities.formatString(
        MessageText.MSG_WARN_COMPLETED,
        addingNovel.title,
        NCODE
      )
    };
  }

  sheetNovels.push(addingNovel);
  writeNovelsToSheet(sheet, sheetNovels);

  return {
    isError: false,
    title: addingNovel.title,
    message: Utilities.formatString(
      MessageText.MSG_WATCH_STARTED,
      addingNovel.title,
      NCODE
    )
  };
}
//--------------------------------------------------------------------------------------------
/**
 * 更新通知設定用のシートから対象のNCODEの小説情報を削除登録する
 *
 * @param {string} ncode
 */
export function DeleteWatchNcode(ncode: string) {
  const NCODE = ncode.toUpperCase();
  const sheet = getSheet();
  const sheetNovels = readNovelsFromSheet(sheet);

  const delNovels = sheetNovels.filter(novel => novel.ncode === ncode);
  if (delNovels.length === 0)
    return {
      isError: true,
      message: Utilities.formatString(MessageText.MSG_WATCH_NOT_FOUND, NCODE)
    };

  const newValues = sheetNovels.filter(novel => novel.ncode !== ncode);
  writeNovelsToSheet(sheet, newValues);
  return {
    isError: false,
    title: delNovels[0].title,
    message: Utilities.formatString(
      MessageText.MSG_WATCH_STOPPED,
      delNovels[0].title,
      NCODE
    )
  };
}
//--------------------------------------------------------------------------------------------
/**
 * @typedef {Object} fetchNaroNovelsResult
 * @property {Boolean} is_error
 * @property {Array.<Novel>} novels
 */

export class FetchNaroNovelsResult {
  public isError: boolean;
  public novels: Novel[];
}
/**
 * 小説家になろうAPIを利用して、作品情報を取得する
 *
 * @param {Array.<string>} ncodes 作品のNCODEの配列
 * @returns {FetchNaroNovelsResult}
 */
export function fetchNaroNovels(ncodes: string[]): FetchNaroNovelsResult {
  if (!ncodes || !ncodes.length || ncodes.length === 0) {
    return {
      isError: false,
      novels: []
    };
  }
  ncodes = ncodes.filter((ncode: string) => ncode);
  if (ncodes.length === 0) {
    return {
      isError: false,
      novels: []
    };
  }

  const fields = [
    "n", //Nコード
    "t", //タイトル
    "w", //作者名
    "gl", //最終掲載日(YYYY-MM-DD HH:MM:SS)
    "ga", //全掲載部分数
    "e", //完結フラグ。短編小説と完結済小説は0。連載中は1。
    "gp", //総合評価ポイント
    "mp" //月間ポイント
  ];

  const parameters = [
    "gzip=5",
    "out=json",
    "lim=500",
    "ncode=" + ncodes.join("-"),
    "of=" + fields.join("-")
  ];

  const url = URLs.URL_NARO_NOVELAPI + "?" + parameters.join("&");
  //  console.log(url);
  const options = {
    method: "get",
    contentType: "application/x-gzip",
    muteHttpExceptions: true
  };

  //var response = UrlFetchApp.fetch(url, options);
  const response = fetchNaro(url, options, 5, 5000);
  if (!handleResponse(response, url, options))
    return { isError: true, novels: [] };

  try {
    const blob = response.getBlob();
    blob.setContentType("application/x-gzip"); //必要か？

    const unzipBlob = Utilities.ungzip(blob);
    const content = unzipBlob.getDataAsString();
    //console.log("content = %s", content);

    const json = JSON.parse(content);

    //１度のAPI呼び出しで取得できる上限件数(500)以上の結果がある場合は考慮しない
    //var all_count = json[0].allcount;

    const novels: Novel[] = json.slice(1).map((jsonNovel: any) => {
      const novel = new Novel();
      novel.ncode = jsonNovel.ncode.toLowerCase();
      novel.NCODE = jsonNovel.ncode.toUpperCase();
      novel.title = jsonNovel.title;
      novel.writer = jsonNovel.writer;
      novel.allNo = jsonNovel.general_all_no;
      novel.end = jsonNovel.end;
      novel.globalPoint = jsonNovel.global_point;
      novel.monthlyPoint = jsonNovel.monthly_point;
      novel.lastup = new Date(jsonNovel.general_lastup.replace(" ", "T"));
      novel.url = URLs.URL_NARO_ROOT + novel.ncode + "/" + novel.allNo + "/";
      return novel;
    });
    //console.log(JSON.stringify(novels));

    return {
      isError: false,
      novels
    };
  } catch (ex) {
    console.error(JSON.stringify(ex));
    return {
      isError: true,
      novels: []
    };
  }
}
/**
 *
 * @param {string} url
 * @param {GoogleAppsScript.URL_Fetch.URLFetchRequestOptions} options
 * @param {Number} retryCount
 * @param {Number} retryInterval
 * @returns {GoogleAppsScript.URL_Fetch.HTTPResponse}
 */
function fetchNaro(
  url: string,
  options: any,
  retryCount: number,
  retryInterval: number
) {
  if (!options.muteHttpExceptions) options.muteHttpExceptions = true;

  while (retryCount--) {
    const response = UrlFetchApp.fetch(url, options);
    if (
      retryCount &&
      response.getResponseCode() === HttpStatus.HTTP_FORBIDDEN
    ) {
      const log =
        "[403 Forbidden]\r\n" +
        "fetch: " +
        url +
        "\r\n" +
        "request: " +
        JSON.stringify(options) +
        "\r\n" +
        "response: " +
        response.getContentText();
      console.log(log);
      Utilities.sleep(retryInterval);
      continue;
    }
    return response;
  }
}

//--------------------------------------------------------------------------------------------
/**
 * LINEの通知用チャンネルへテキストメッセージを送信する。
 * LINEの通知用チャンネルのアクセストークンはスクリプトのプロパティ(PROPERTY_LINE_CHANNEL_ACCESS_TOKEN)で指定する。
 *
 * @param  {Array.<string>}   messages    テキストメッセージ文字列の配列。
 * @param {string} userId メッセージ送付先ユーザーID。省略可能。
 * @param  {string}  replyToken  返信用のトークン。省略可能。
 */
export function sendMessagesText(
  messages: string[],
  userId: string = "",
  replyToken: string = ""
) {
  //送信する内容を作成
  const allMessages = messages.map((text: string, index: number) => {
    console.info(
      Utilities.formatString(
        "Line へメッセージ送信[%d/%d]: %s",
        index + 1,
        messages.length,
        text
      )
    );
    return { type: "text", text };
  });
  sendMessagesPayload(allMessages, userId, replyToken);
}
//--------------------------------------------------------------------------------------------
/**
 * LINEの通知用チャンネルへカルーセルメッセージを送信する。
 * LINEの通知用チャンネルのアクセストークンはスクリプトのプロパティ(PROPERTY_LINE_CHANNEL_ACCESS_TOKEN)で指定する。
 *
 * @param {Array.<Column>} columns
 * @param {string} altText
 * @param {string} userId
 * @param {string} replyToken
 */
export function sendMessagesCarousel(
  columns: any[],
  altText: string,
  userId: string = "",
  replyToken: string = ""
) {
  const messages = [];
  while (0 < columns.length) {
    const message = {
      type: "template",
      altText,
      template: {
        type: "carousel",
        columns: columns.shiftMultiple(10)
      }
    };
    messages.push(message);
  }
  sendMessagesPayload(messages, userId, replyToken);
}
//--------------------------------------------------------------------------------------------
/**
 * LINEの通知用チャンネルへメッセージを送信する。
 * LINEの通知用チャンネルのアクセストークンはスクリプトのプロパティ(PROPERTY_LINE_CHANNEL_ACCESS_TOKEN)で指定する。
 *
 * @param {Array.<Message>} messages
 * @param {string} userId
 * @param {string} replyToken
 */
export function sendMessagesPayload(
  messages: any[],
  userId: string = "",
  replyToken: string = ""
) {
  //LINE Developersで取得したアクセストークンを入れる
  const accessToken = PropertiesService.getScriptProperties().getProperty(
    PropertyKeys.PROPERTY_LINE_CHANNEL_ACCESS_TOKEN
  );

  let sendCount = 0;
  while (0 < messages.length) {
    const msgs = messages.shiftMultiple(5);
    //console.log(JSON.stringify(msgs));

    let url: string;
    let payload: any;
    if (replyToken && sendCount === 0) {
      url = URLs.URL_LINE_API_REPLY;
      payload = { replyToken, messages: msgs };
    } else if (userId) {
      url = URLs.URL_LINE_API_PUSH;
      payload = { to: userId, messages: msgs };
    } else {
      url = URLs.URL_LINE_API_BROADCAST;
      payload = { messages: msgs };
    }
    //    if(0 < sendCount)
    //      payload["notificationDisabled"] = true;

    const options = {
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        Authorization: "Bearer " + accessToken
      },
      method: "post",
      muteHttpExceptions: true,
      payload: JSON.stringify(payload)
    };

    const response = UrlFetchApp.fetch(
      url,
      options as GoogleAppsScript.URL_Fetch.URLFetchRequestOptions
    );
    if (!handleResponse(response, url, options)) break;

    sendCount += 1;
  }
}
//--------------------------------------------------------------------------------------------
/**
 * URLからパラメータを取得する
 *
 * @param  {string} url  対象のURL文字列
 * @param  {string} key パラメータのキー文字列
 * @returns {string}
 */
export function getUrlParameter(url: string, key: string): string {
  key = key.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp("[?&]" + key + "(=([^&#]*)|&|#|$)");
  const matches = regex.exec(url);
  if (!matches || !matches[2]) return "";
  return decodeURIComponent(matches[2].replace(/\+/g, " "));
}
//--------------------------------------------------------------------------------------------
/**
 * HTTPレスポンスコードに応じてログ出力する
 *
 * @param {GoogleAppsScript.URL_Fetch.HTTPResponse} response
 * @param {string} url
 * @param {GoogleAppsScript.URL_Fetch.URLFetchRequestOptions} options
 * @returns {Boolean} HTTPレスポンスコードが(200 OK)の場合はtrue、それ以外はfalse
 */
export function handleResponse(
  response: GoogleAppsScript.URL_Fetch.HTTPResponse,
  url: string,
  options: any
): boolean {
  const LOG_DEBUG = 0;
  const LOG_INFO = 1;
  const LOG_WARN = 2;
  const LOG_ERROR = 3;

  let logLevel: number;
  let responseCodeText: string;
  const responseCode = response.getResponseCode();

  if (responseCode === HttpStatus.HTTP_OK) {
    //    logLevel = LOG_DEBUG;
    //    responseCodeText = "200 OK";
    return true;
  } else if (responseCode === HttpStatus.HTTP_REDIRECT) {
    logLevel = LOG_WARN;
    responseCodeText = "302 Found/Redirect";
  } else if (responseCode === HttpStatus.HTTP_BAD_REQUEST) {
    logLevel = LOG_ERROR;
    responseCodeText = "400 Bad Request";
  } else if (responseCode === HttpStatus.HTTP_UNAUTHORIZED) {
    logLevel = LOG_ERROR;
    responseCodeText = "401 Unauthorized";
  } else if (responseCode === HttpStatus.HTTP_FORBIDDEN) {
    logLevel = LOG_WARN;
    responseCodeText = "403 Forbidden";
  } else if (responseCode === HttpStatus.HTTP_NOT_FOUND) {
    logLevel = LOG_ERROR;
    responseCodeText = "404 Not Found";
  } else if (responseCode === HttpStatus.HTTP_REQUEST_TIMEOUT) {
    logLevel = LOG_ERROR;
    responseCodeText = "408 Request Timeout";
  } else if (responseCode === HttpStatus.HTTP_INTERNAL_ERROR) {
    logLevel = LOG_ERROR;
    responseCodeText = "500 Internal Server Error";
  } else if (responseCode === HttpStatus.HTTP_SERVICE_UNAVAILABLE) {
    logLevel = LOG_ERROR;
    responseCodeText = "503 Service Unavailable";
  } else {
    logLevel = LOG_ERROR;
    responseCodeText = "" + responseCode;
  }

  const log =
    "[" +
    responseCodeText +
    "]\r\n" +
    "fetch: " +
    url +
    "\r\n" +
    "request: " +
    JSON.stringify(options) +
    "\r\n" +
    "response: " +
    response.getContentText();

  if (logLevel === LOG_DEBUG) {
    console.log(log);
  } else if (logLevel === LOG_INFO) {
    console.info(log);
  } else if (logLevel === LOG_WARN) {
    console.warn(log);
  } else if (logLevel === LOG_ERROR) {
    console.error(log);
  }

  return responseCode === HttpStatus.HTTP_OK;
}
