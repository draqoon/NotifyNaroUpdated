//export namespace Constants {
// --------------------------------------------------------------------------------------------
// シートの列番号
export namespace Columns {
  export const COL_NCODE = 0;
  export const COL_TITLE = 1;
  export const COL_WRITER = 2;
  export const COL_LASTUP = 3;
  export const COL_ALL_NO = 4;
  export const COL_URL = 5;
  export const COL_END = 6;
  export const COL_GLOBAL_POINT = 7;
  export const COL_MONTHLY_POINT = 8;
  export const COL_COUNT = 9;
}

// --------------------------------------------------------------------------------------------
// HTTP ステータスコード
export namespace HttpStatus {
  export const HTTP_OK = 200;
  export const HTTP_REDIRECT = 302;
  export const HTTP_BAD_REQUEST = 400;
  export const HTTP_UNAUTHORIZED = 401;
  export const HTTP_FORBIDDEN = 403;
  export const HTTP_NOT_FOUND = 404;
  export const HTTP_REQUEST_TIMEOUT = 408;
  export const HTTP_INTERNAL_ERROR = 500;
  export const HTTP_SERVICE_UNAVAILABLE = 503;
}

// --------------------------------------------------------------------------------------------
// スクリプトのプロパティ
export namespace PropertyKeys {
  export const PROPERTY_SPREADSHEET_FILE_ID = "SPREADSHEET_FILE_ID";
  export const PROPERTY_LINE_CHANNEL_ACCESS_TOKEN = "LINE_CHANNEL_ACCESS_TOKEN";
  export const PROPERTY_LINE_CHANNEL_SECRET = "LINE_CHANNEL_SECRET";
  export const PROPERTY_NARO_ID = "NARO_ID";
  export const PROPERTY_NARO_PW = "NARO_PW";
}

// --------------------------------------------------------------------------------------------
// URL
export namespace URLs {
  export const URL_LINE_API_REPLY = "https://api.line.me/v2/bot/message/reply";
  export const URL_LINE_API_PUSH = "https://api.line.me/v2/bot/message/push";
  export const URL_LINE_API_BROADCAST =
    "https://api.line.me/v2/bot/message/broadcast";
  export const URL_NARO_ROOT = "https://ncode.syosetu.com/";
  export const URL_NARO_NOVELAPI = "https://api.syosetu.com/novelapi/api/";
  export const URL_NARO_LOGIN = "https://ssl.syosetu.com/login/login/";
  export const URL_NARO_NOTICE_LIST =
    "https://syosetu.com/favnovelmain/isnoticelist/";
}

// --------------------------------------------------------------------------------------------
// メッセージ
export namespace MessageText {
  export const MSG_WATCH_STARTING = "add " + URLs.URL_NARO_ROOT + "%s/";
  export const MSG_WATCH_STARTED = "「%s(%s)の監視を開始しました。";
  export const MSG_WATCH_STOPING = "del " + URLs.URL_NARO_ROOT + "%s/";
  export const MSG_WATCH_STOPPED = "「%s(%s)」の監視を停止しました。";
  export const MSG_WATCH_NOT_FOUND = "%s は更新通知の対象になっていません。";
  export const MSG_NOTIFY_UPDATED =
    "%sに\r\n「%s」第%d話が公開されました。\r\n" +
    URLs.URL_NARO_ROOT +
    "%s/%d/";
  export const MSG_NOTIFY_UPDATED2 = "%sに\r\n「%s」第%d話が公開されました。";
  export const MSG_NOTIFY_COMPLETE =
    "%sに\r\n「%s」第%d話が公開されました。(完結)\r\n" +
    URLs.URL_NARO_ROOT +
    "%s/%d/";
  export const MSG_NOTIFY_COMPLETE2 =
    "%sに\r\n「%s」第%d話が公開されました。(完結)";
  export const MSG_NOT_UPDATED = "新たに公開されたタイトルはありません。";
  export const MSG_INVALID_COMMAND = "無効なコマンドです。";
  export const MSG_COMMAND_USAGE = "コマンドの使い方";
  export const MSG_COMMAND_USAGE_ADD =
    "add <作品URL>|<NCODE>\r\n指定した作品の監視を開始します。";
  export const MSG_COMMAND_USAGE_DEL =
    "del <作品URL>|<NCODE>\r\n指定した作品の監視を停止します。";
  export const MSG_COMMAND_USAGE_LIST = "list\r\n監視中の一覧を表示します。";
  export const MSG_COMMAND_USAGE_CHECK = "check\r\nすぐに監視を実行します。";
  export const MSG_COMMAND_USAGE_HELP =
    "help\r\nコマンドの使い方を表示します。";
  export const MSG_WARN_ALREADY_WATCHING =
    "%s は既に監視の対象になっています。";
  export const MSG_WARN_NARO_API_ERROR =
    "小説家になろうAPIが正常に終了しませんでした。";
  export const MSG_WARN_COMPLETED = "「%s(%s)は既に完結しています。";
  export const MSG_NCODE_NOT_FOUND = "%s は見つかりませんでした。";
  export const MSG_USER_FOLLOWED = "ユーザー(%s)に友だち追加されました。";
  export const MSG_USER_UNFOLLOWED = "ユーザー(%s)にブロックされました。";
  export const MSG_LIST_CAROUSEL_ALT_TEXT = "監視リスト";

  export const MSG_NOTIFY_ERROR =
    "エラーが発生しました。後ほど再実行してください。";
  export const MSG_WARN_COMMAND_EXPIRED = "コマンドの有効期限が切れています。";

  export const LABEL_RESTART_WATCH = "監視再開";
  export const LABEL_STOP_WATCH = "監視停止";
  export const LABEL_CANCEL = "キャンセル";
}

// --------------------------------------------------------------------------------------------
export namespace Flags {
  export const END_COMPLETE = 0;
  export const END_CONTINUOUS = 1;
}
//}
