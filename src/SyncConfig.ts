import {
  fetchNaroNovels,
  getSheet,
  handleResponse,
  readNovelsFromSheet,
  writeNovelsToSheet
} from "./Common";
import { PropertyKeys, URLs } from "./Constants";

function updateConfigList() {
  const properties = PropertiesService.getScriptProperties();

  const naroId = properties.getProperty(PropertyKeys.PROPERTY_NARO_ID);
  const naroPwd = properties.getProperty(PropertyKeys.PROPERTY_NARO_PW);

  // ログイン認証
  const loginResult = loginNaro(naroId, naroPwd);
  if (loginResult.isError) return;
  //properties.setProperties(JSON.stringify(loginResult.cookies));

  const result = getNoticeNcodes(loginResult.cookies);
  if (result.isError) return;
  const watchNcodes = result.ncodes;

  const sheet = getSheet();
  const sheetNovels = readNovelsFromSheet(sheet)
    //削除分の処理
    .filter(novel => watchNcodes.indexOf(novel.ncode) !== -1);
  //console.log(JSON.stringify(sheetValues));

  //追加分の処理
  const addedNcodes = watchNcodes.filter(
    ncode => !sheetNovels.some(novel => novel.ncode === ncode)
  );
  //console.log(JSON.stringify(addedNcodes));
  if (0 < addedNcodes.length) {
    const fetchResult = fetchNaroNovels(addedNcodes);
    if (fetchResult.isError) {
      return;
    }
    //console.log(JSON.stringify(r.novels));
    for (const novel of fetchResult.novels) {
      sheetNovels.push(novel);
    }
    //console.log(JSON.stringify(sheetNovels));
  }

  //シート更新
  writeNovelsToSheet(sheet, sheetNovels);
}
//--------------------------------------------------------------------------------------------
/**
 *
 * @param userid
 * @param password
 */
function loginNaro(userid: string, password: string) {
  const url = URLs.URL_NARO_LOGIN;
  const options: any = {
    method: "POST",
    payload: {
      narouid: userid,
      pass: password
    },
    followRedirects: true,
    muteHttpExceptions: true,
    headers: {
      accept: "text/html"
    }
  };
  const response = UrlFetchApp.fetch(url, options);
  if (!handleResponse(response, url, options))
    return {
      isError: true,
      cookies: null
    };
  const cookies = response.getHeaders()["Set-Cookie"];

  return {
    isError: false,
    cookies
  };
}
//--------------------------------------------------------------------------------------------
/**
 * 
 * @param cookies 
 */
function getNoticeNcodes(cookies: {}) {
  // ログインで認証されたcookieを使用して通知一覧ページをリクエスト
  const url = URLs.URL_NARO_NOTICE_LIST;
  const options: any = {
    method: "GET",
    followRedirects: true, //リダイレクトあり
    muteHttpExceptions: true,
    headers: {
      Cookie: cookies,
      accept: "text/html"
    }
  };

  const response = UrlFetchApp.fetch(url, options);
  if (!handleResponse(response, url, options))
    return {
      is_error: true,
      ncodes: []
    };
  const html = response.getContentText();

  const regexp = new RegExp(
    '^href="' + URLs.URL_NARO_ROOT + '([^"/]+)/?">(.+)$'
  );

  const matches = /<a class="title"([^<]+)<\/a>/.exec(html);

  const ncodes = matches
    .map(text => {
      const match = regexp.exec(text);
      if (match) {
        return match[1].toUpperCase();
      }
      return undefined;
    })
    .filter(ncode => ncode);

  return {
    isError: true,
    ncodes
  };
}
//--------------------------------------------------------------------------------------------
