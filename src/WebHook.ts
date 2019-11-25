import { CheckUpdate } from "./Check";
import {
  AddWatchNcode,
  DeleteWatchNcode,
  getSheet,
  getUrlParameter,
  readNovelsFromSheet,
  sendMessagesCarousel,
  sendMessagesPayload,
  sendMessagesText
} from "./Common";
import { Flags, MessageText, URLs } from "./Constants";

class WebhookEvent {
  public type: string;
  public timestamp: number;
  public source: any;
  public replyToken: string;
  public message: any;
  public postback: any;
}

/**
 * POSTされた場合のイベントハンドラ
 *
 * @param {GoogleAppsScript.Events.DoPost} e
 */
function doPost(e: GoogleAppsScript.Events.DoPost) {
  //  console.log("[DEBUG] post: %s", JSON.stringify(e));

  //現在リクエストヘッダー(X-Line-Signature)を参照できないので、署名の検証は行わない（行えない）
  //  if(!validateSignature(e)) {
  //    console.error("");
  //    return ContentService
  //               .createTextOutput(JSON.stringify({'content': 'post ng'}))
  //               .setMimeType(ContentService.MimeType.JSON);
  //  }

  if (e && e.postData && e.postData.contents) {
    try {
      const json = JSON.parse(e.postData.contents);
      if (json && json.events && json.events.length) {
        json.events.forEach((event: WebhookEvent, index: number) =>
          handleEvent(index, event)
        );
      }
    } catch (ex) {
      console.error(JSON.stringify(ex));
      console.error("e.postData.contents = %s", ex.postData.contents);
    }
  }

  return ContentService.createTextOutput(
    JSON.stringify({ content: "post ok" })
  ).setMimeType(ContentService.MimeType.JSON);
}
//--------------------------------------------------------------------------------------------
/**
 * リクエストヘッダーの署名を検証する
 * ※現在リクエストヘッダー(X-Line-Signature)を参照できないので、署名の検証は行わない（行えない）
 *
 * @param {GoogleAppsScript.Events.DoPost} e
 * @returns {Boolean}
 */
function validateSignature(e: GoogleAppsScript.Events.DoPost): boolean {
  //  var lineSignature = "......"; //
  //  var secret = PropertiesService.getScriptProperties().getProperty(PROPERTY_LINE_CHANNEL_SECRET);
  return true;
}
//--------------------------------------------------------------------------------------------
/**
 * Line Webhook から送付されたイベントを処理する
 *
 * @param {number} index
 * @param {WebhookEvent} event
 * @returns {Boolean}
 */
function handleEvent(index: number, event: WebhookEvent): boolean {
  try {
    if (event.type === "follow") {
      //フォローイベント
      console.log(Utilities.formatString("WebHook[%d]: %s", index, event.type));
      onFollow(event);
    } else if (event.type === "unfollow") {
      //フォロー解除イベント
      console.log(Utilities.formatString("WebHook[%d]: %s", index, event.type));
      onUnfollow(event);
    } else if (event.type === "message") {
      //メッセージイベント
      if (event.message && event.message.text === "Hello, world") {
        console.log(Utilities.formatString("WebHook[%d]: 接続確認", index));
      } else {
        console.log(
          Utilities.formatString("WebHook[%d]: %s", index, event.type)
        );
        onMessage(event);
      }
    } else if (event.type === "postback") {
      //ポストバックイベント
      console.log(Utilities.formatString("WebHook[%d]: %s", index, event.type));
      onPostback(event);
    } else {
      console.warn(
        Utilities.formatString("WebHook[%d]: unknown(%s)", index, event.type)
      );
      console.warn(JSON.stringify(event));
      return false;
    }
    return true;
  } catch (ex) {
    console.error(JSON.stringify(ex));
    console.error(
      Utilities.formatString("event[%d] = %s", index, JSON.stringify(event))
    );
    return false;
  }
}
//--------------------------------------------------------------------------------------------
/**
 *
 * @param {WebhookEvent} event
 */
function onFollow(event: WebhookEvent) {
  const replyToken = event.replyToken;
  const userId = event.source.userId;
  console.info(MessageText.MSG_USER_FOLLOWED, userId);

  onCommandHelp(userId, replyToken, false);
}
//--------------------------------------------------------------------------------------------
/**
 *
 * @param {WebhookEvent} event
 */
function onUnfollow(event: WebhookEvent) {
  const userId = event.source.userId;
  console.info(MessageText.MSG_USER_UNFOLLOWED, userId);
}
//--------------------------------------------------------------------------------------------
/**
 *
 * @param {WebhookEvent} event
 */
function onPostback(event: WebhookEvent) {
  const replyToken = event.replyToken;
  const userId = event.source.userId;

  const data = (event && event.postback ? event.postback.data : "").trim();
  const command = getUrlParameter(data, "command");
  const ncode = getUrlParameter(data, "ncode");
  const timeText = getUrlParameter(data, "time");

  const FIVE_MINUTE_MILLISECOND = 5 * 60 * 1000;
  const time = timeText ? new Date(timeText).getTime() : 0;
  const now = new Date().getTime();
  if (FIVE_MINUTE_MILLISECOND < now - time) {
    console.warn(
      "postback command: %s (ncode = %s), %s",
      command,
      ncode,
      MessageText.MSG_WARN_COMMAND_EXPIRED
    );
    sendMessagesText(
      [MessageText.MSG_WARN_COMMAND_EXPIRED],
      userId,
      replyToken
    );
    return;
  }

  if (command === "del" || command === "delete") {
    console.log("postback command: %s (ncode = %s)", command, ncode);
    onCommandDel(userId, replyToken, ncode);
  } else if (command === "add") {
    console.log("postback command: %s (ncode = %s)", command, ncode);
    onCommandAdd(userId, replyToken, ncode);
  } else {
    console.warn("postback command: unkown (data = " + data + ")");
  }
}
//--------------------------------------------------------------------------------------------
/**
 *
 * @param {WebhookEvent} event
 */
function onMessage(event: WebhookEvent) {
  const replyToken = event.replyToken;
  const userId = event.source.userId;

  const text: string = (event && event.message
    ? event.message.text
    : ""
  ).trim();
  if (!text) {
    onCommandHelp(userId, replyToken, true);
    return;
  }

  console.log("command: %s", text);

  if (text === "list") {
    onCommandList(userId, replyToken);
    return;
  } else if (text === "del") {
    onCommandDelList(userId, replyToken);
    return;
  } else if (text === "check") {
    onCommandCheck(userId, replyToken);
    return;
  } else if (text === "help") {
    onCommandHelp(userId, replyToken, false);
    return;
  }

  const m = text.match(
    /^(add|del(?:ete)?) +(?:https:\/\/ncode.syosetu.com\/(?:novelview\/infotop\/ncode\/)?)?(n[^\/]+)(?:.*)?$/i
  );
  if (m) {
    const command = m[1].toLowerCase();
    const ncode = m[2].toLowerCase();
    if (command === "add") {
      onCommandAdd(userId, replyToken, ncode);
      return;
    } else if (command === "del" || command === "delete") {
      onCommandDel(userId, replyToken, ncode);
      return;
    }
  }

  onCommandHelp(userId, replyToken, true);
}
//--------------------------------------------------------------------------------------------
/**
 *
 * @param {string} userId
 * @param {string} replyToken
 * @param {string} ncode
 */
function onCommandAdd(userId: string, replyToken: string, ncode: string) {
  const result = AddWatchNcode(ncode);
  if (result.isError) {
    sendMessagesText([result.message], userId, replyToken);
    return;
  }
  const time = Utilities.formatDate(
    new Date(),
    "JST",
    "yyyy-MM-dd HH:mm:ss"
  ).replace(" ", "T");
  const buttons = {
    type: "buttons",
    text: result.message.substring(0, 160),
    defaultAction: {
      type: "uri",
      label: "label",
      uri: Utilities.formatString(URLs.URL_NARO_ROOT + "%s/", ncode)
    },
    actions: [
      {
        type: "postback",
        label: MessageText.LABEL_STOP_WATCH,
        displayText: Utilities.formatString(
          MessageText.MSG_WATCH_STOPING,
          ncode.toLowerCase()
        ),
        data: Utilities.formatString(
          "?command=del&ncode=%s&time=%s",
          ncode,
          time
        )
      }
    ]
  };
  const message = {
    type: "template",
    altText: result.message.substring(0, 400),
    template: buttons
  };
  console.info(result.message);
  sendMessagesPayload([message], userId, replyToken);
}
//--------------------------------------------------------------------------------------------
/**
 *
 * @param {string} userId
 * @param {string} replyToken
 * @param {string} ncode
 */
function onCommandDel(userId: string, replyToken: string, ncode: string) {
  const result = DeleteWatchNcode(ncode);
  if (result.isError) {
    sendMessagesText([result.message], userId, replyToken);
    return;
  }
  const time = Utilities.formatDate(
    new Date(),
    "JST",
    "yyyy-MM-dd HH:mm:ss"
  ).replace(" ", "T");
  const buttons = {
    type: "buttons",
    text: result.message.substring(0, 160),
    defaultAction: {
      type: "uri",
      label: "label",
      uri: Utilities.formatString(URLs.URL_NARO_ROOT + "%s/", ncode)
    },
    actions: [
      {
        type: "postback",
        label: MessageText.LABEL_RESTART_WATCH,
        displayText: Utilities.formatString(
          MessageText.MSG_WATCH_STARTING,
          ncode.toLowerCase()
        ),
        data: Utilities.formatString(
          "?command=add&ncode=%s&time=%s",
          ncode,
          time
        )
      }
    ]
  };
  const message = {
    type: "template",
    altText: result.message.substring(0, 400),
    template: buttons
  };
  console.info(result.message);
  sendMessagesPayload([message], userId, replyToken);
}
//--------------------------------------------------------------------------------------------
/**
 *
 * @param {string} userId
 * @param {string} replyToken
 */
function onCommandList(userId: string, replyToken: string) {
  const sheet = getSheet();
  const sheetNovels = readNovelsFromSheet(sheet);

  const messages = sheetNovels
    .map((novel, index) => {
      return Utilities.formatString(
        "[%d] %s (%s)",
        index + 1,
        novel.title,
        novel.writer
      );
    })
    .reduce(
      (result, text) => {
        const message = result[result.length - 1] + "\r\n" + text;
        if (2000 < message.length) {
          result.push(text);
        } else {
          result[result.length - 1] = message;
        }
        return result;
      },
      ["[監視リスト] 全" + sheetNovels.length + "件"]
    );

  sendMessagesText(messages, userId, replyToken);
}
//--------------------------------------------------------------------------------------------
/**
 *
 * @param {string} userId
 * @param {string} replyToken
 */
function onCommandDelList(userId: string, replyToken: string) {
  //sendMessagesText(["reply: list"], replyToken);

  const sheet = getSheet();
  const sheetNovels = readNovelsFromSheet(sheet);
  const time = Utilities.formatDate(
    new Date(),
    "JST",
    "yyyy-MM-dd HH:mm:ss"
  ).replace(" ", "T");

  const columns = sheetNovels.map(novel => {
    const lastup = Utilities.formatDate(
      novel.lastup,
      "JST",
      "yyyy-MM-dd HH:mm"
    );
    const end = novel.end === Flags.END_CONTINUOUS ? "連載中" : "完結";
    const text = Utilities.formatString(
      "%s(%s)\r\n最終更新：%s\r\n最新話：%d (%s)\r\n月間ポイント：%d\r\n総合評価ポイント：%d",
      novel.title,
      novel.writer,
      lastup,
      novel.allNo,
      end,
      novel.monthlyPoint,
      novel.globalPoint
    );

    return {
      text: text.substring(0, 120),
      defaultAction: {
        type: "uri",
        label: "label",
        uri: novel.url
      },
      actions: [
        {
          type: "postback",
          label: MessageText.LABEL_STOP_WATCH,
          displayText: Utilities.formatString(
            MessageText.MSG_WATCH_STOPING,
            novel.NCODE
          ),
          data: Utilities.formatString(
            "?command=del&ncode=%s&time=%s",
            novel.ncode,
            time
          )
        }
        //        {
        //          type: "postback",
        //          label: LABEL_RESTART_WATCH,
        //          displayText: Utilities.formatString(MSG_WATCH_STARTING, novel.NCODE),
        //          data: Utilities.formatString("?command=add&ncode=%s", novel.ncode),
        //        },
      ]
    };
  });

  const log =
    "[監視リスト]\r\n" +
    sheetNovels
      .map((novel, index, array) =>
        Utilities.formatString(
          "[%d/%d] %s (%s)",
          index + 1,
          array.length,
          novel.title,
          novel.writer
        )
      )
      .join("\r\n");
  console.info(log);
  sendMessagesCarousel(
    columns,
    MessageText.MSG_LIST_CAROUSEL_ALT_TEXT,
    userId,
    replyToken
  );
}
//--------------------------------------------------------------------------------------------
/**
 *
 * @param {string} userId
 * @param {string} replyToken
 */
function onCommandCheck(userId: string, replyToken: string) {
  CheckUpdate(userId, replyToken);
}
//--------------------------------------------------------------------------------------------
/**
 *
 * @param {string} userId
 * @param {string} replyToken
 * @param {boolean} invalid
 */
function onCommandHelp(userId: string, replyToken: string, invalid: boolean) {
  const messages = [];
  if (invalid) {
    messages.push({ type: "text", text: MessageText.MSG_INVALID_COMMAND });
  }

  const texts = [];
  texts.push(MessageText.MSG_COMMAND_USAGE);
  texts.push(MessageText.MSG_COMMAND_USAGE_ADD);
  texts.push(MessageText.MSG_COMMAND_USAGE_DEL);
  texts.push(MessageText.MSG_COMMAND_USAGE_LIST);
  texts.push(MessageText.MSG_COMMAND_USAGE_CHECK);
  texts.push(MessageText.MSG_COMMAND_USAGE_HELP);
  messages.push({ type: "text", text: texts.join("\r\n") });

  sendMessagesText(messages, userId, replyToken);
}
