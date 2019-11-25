import { Columns, PropertyKeys } from "./Constants";

function initialize() {
  const properties = PropertiesService.getScriptProperties();

  const fileId = properties.getProperty(
    PropertyKeys.PROPERTY_SPREADSHEET_FILE_ID
  );
  try {
    //DriveApp.getFileById(fileId);
    SpreadsheetApp.openById(fileId);
  } catch {
    const file = SpreadsheetApp.create("小説家になろう更新通知リスト");
    properties.setProperty(
      PropertyKeys.PROPERTY_SPREADSHEET_FILE_ID,
      file.getId()
    );
    properties.setProperty(PropertyKeys.PROPERTY_LINE_CHANNEL_ACCESS_TOKEN, "");

    initSheet(file);
  }
}

/**
 * initialize sheet
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 */
function initSheet(
  file: GoogleAppsScript.Spreadsheet.Spreadsheet
): GoogleAppsScript.Spreadsheet.Sheet {
  if (!file) return;
  const sheet = file.getSheets()[0];
  const headerRows = 1;
  const bodyRows = 30;

  //ヘッダー行
  const header = sheet.getRange(headerRows, 1, 1, Columns.COL_COUNT);
  const headerData = header.getValues();
  headerData[0][Columns.COL_NCODE] = "Nコード";
  headerData[0][Columns.COL_TITLE] = "タイトル";
  headerData[0][Columns.COL_WRITER] = "作者";
  headerData[0][Columns.COL_LASTUP] = "最終更新";
  headerData[0][Columns.COL_ALL_NO] = "話数";
  headerData[0][Columns.COL_URL] = "最新話";
  headerData[0][Columns.COL_END] = "完結";
  headerData[0][Columns.COL_GLOBAL_POINT] = "総合評価ポイント";
  headerData[0][Columns.COL_MONTHLY_POINT] = "月間ポイント";
  header.setValues(headerData);
  header.setBorder(true, true, true, true, true, true);
  header.setHorizontalAlignment("center");
  header.setBackground("#c9daf8");
  header.setFontWeight("bold");
  //header.setFontFamily("Courier New");

  //ボディー 行
  const body = sheet.getRange(headerRows + 1, 1, bodyRows, Columns.COL_COUNT);
  body.setFontFamily("Courier New");
  body.setBorder(true, true, true, true, true, true);

  //Nコード 列
  const ncode = sheet.getRange(headerRows + 1, Columns.COL_NCODE + 1, bodyRows);
  ncode.setHorizontalAlignment("center");
  ncode.setBackground("#a1f0ba");

  //最終更新 列
  const lastup = sheet.getRange(
    headerRows + 1,
    Columns.COL_LASTUP + 1,
    bodyRows
  );
  lastup.setHorizontalAlignment("center");
  lastup.setNumberFormat("yyyy-MM-dd hh:mm");

  //総合評価ポイント、月間ポイント 列
  const point = sheet.getRange(
    headerRows + 1,
    Columns.COL_GLOBAL_POINT + 1,
    bodyRows,
    2
  );
  point.setHorizontalAlignment("normal");
  point.setNumberFormat("#,###");

  //条件付き書式
  const rule1 = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied("=AND($D2>Today()-3, MOD(ROW(),2)=1)")
    .setRanges([lastup])
    .setFontColor("red")
    .setBackground("#dce7fa")
    .build();

  const rule2 = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied("=$D2>Today()-3")
    .setRanges([lastup])
    .setFontColor("red")
    .build();

  const rule3 = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied("=MOD(ROW(),2)=1")
    .setRanges([body])
    .setBackground("#dce7fa")
    .build();
  const rules = sheet.getConditionalFormatRules();
  rules.push(rule1, rule2, rule3);
  sheet.setConditionalFormatRules(rules);

  //行固定
  sheet.setFrozenRows(1);

  //列幅
  sheet.setColumnWidth(Columns.COL_NCODE + 1, 73);
  sheet.setColumnWidth(Columns.COL_TITLE + 1, 333);
  sheet.setColumnWidth(Columns.COL_WRITER + 1, 116);
  sheet.setColumnWidth(Columns.COL_LASTUP + 1, 139);
  sheet.setColumnWidth(Columns.COL_ALL_NO + 1, 46);
  sheet.setColumnWidth(Columns.COL_URL + 1, 188);
  sheet.setColumnWidth(Columns.COL_END + 1, 46);
  sheet.setColumnWidth(Columns.COL_GLOBAL_POINT + 1, 115);
  sheet.setColumnWidth(Columns.COL_MONTHLY_POINT + 1, 115);

  return sheet;
}
