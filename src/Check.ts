/**
 * @fileoverview 作品の更新チェックと通知を行なう処理
 */

import { fetchNaroNovels, getSheet, Novel, readNovelsFromSheet, sendMessagesText, writeNovelsToSheet } from "./Common";
import { Flags, MessageText } from "./Constants";

//--------------------------------------------------------------------------------------------
/**
 * 
 */
function setTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for(let i = triggers.length - 1; 0 <= i; i--) {
    const name = triggers[i].getHandlerFunction();
    if (name === "main") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  let nextHour = hour;
  let nextMinute = Math.ceil(minute / 15) * 15;
  if(60 <= nextMinute) {
    nextHour += 1;
    nextMinute -= 60;
  }
  
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), nextHour, nextMinute, 0);
  //console.log(Utilities.formatDate(date, 'JST', 'yyyy-MM-dd hh:mm:ss'));
  
  ScriptApp.newTrigger("main").timeBased().at(date).create();
}
//--------------------------------------------------------------------------------------------
/**
 * 
 */
function main() {
  //setTrigger();
  
  CheckUpdate();
}
//--------------------------------------------------------------------------------------------
/**
 * 
 * @param {string} userId 
 * @param {string} replyToken 
 */
export function CheckUpdate(userId: string = "", replyToken: string = "") {
  const sheet = getSheet();
  const sheetNovels = readNovelsFromSheet(sheet);
  
  const ncodes = sheetNovels.map((novel) => novel.ncode);

  const result = fetchNaroNovels(ncodes);
  if(result.isError) {
    if(userId || replyToken) sendMessagesText([MessageText.MSG_NOTIFY_ERROR], userId, replyToken);
    return;
  }
  
  const updatedNovels = result.novels
                              .filter((novel) =>
                                 sheetNovels.some((sheetNovel) => 
                                              sheetNovel.ncode === novel.ncode &&
                                              sheetNovel.allNo < novel.allNo
                                            )
                              );

  //send message to line
  if(0 < updatedNovels.length) {
    sendMessages(updatedNovels);
  }
  
  //完結した作品を取り除く
  const continuousNovels = result.novels
                                 .filter((novel) => novel.end === Flags.END_CONTINUOUS)
                                 .copySort((x, y) => x.lastup.getTime() - y.lastup.getTime());

  //update sheet
  writeNovelsToSheet(sheet, continuousNovels);
  
  if( updatedNovels.length === 0 ) {
    if(userId || replyToken) sendMessagesText([MessageText.MSG_NOT_UPDATED], userId, replyToken);
    console.info(MessageText.MSG_NOT_UPDATED);
  }
}
//--------------------------------------------------------------------------------------------
/**
 * 
 * @param {Array.<Novel>} novels 
 */
function sendMessages(novels: Novel[]) {
  const texts = novels
    .copySort((x, y) => x.lastup.getTime() - y.lastup.getTime()                )
                .map((novel) =>{
                  const lastup = Utilities.formatDate(novel.lastup, "JST", "yyyy-MM-dd HH:mm");
                  if(novel.end === Flags.END_CONTINUOUS) {
                    //連載中
                    return Utilities.formatString(MessageText.MSG_NOTIFY_UPDATED, 
                                                  lastup, novel.title, novel.allNo, novel.ncode, novel.allNo);
                  }
                  else {
                    //完結
                    return Utilities.formatString(MessageText.MSG_NOTIFY_COMPLETE,
                                                  lastup, novel.title, novel.allNo, novel.ncode, novel.allNo);
                  }
                });
  sendMessagesText(texts);  
}
