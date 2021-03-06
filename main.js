// シート名
var categorySheetName = 'category';
var expensesSheetName = 'expenses';
var transactionsSheetName = 'transactions';
var banklistSheetName = 'banklist';
var dailySheetName = 'daily';
var creditcardSheetName = 'creditcard';
var creditcardListSheetName = 'creditcard_list';

// 特定のシートのメモ化
function getCategorySheet() {
  if (getCategorySheet.memoSheet) {
    return getCategorySheet.memoSheet;
  }
  getCategorySheet.memoSheet =
      SpreadsheetApp.getActive().getSheetByName(categorySheetName);
  return getCategorySheet.memoSheet;
}

function getExpensesSheet() {
  if (getExpensesSheet.memoSheet) {
    return getExpensesSheet.memoSheet;
  }
  getExpensesSheet.memoSheet =
      SpreadsheetApp.getActive().getSheetByName(expensesSheetName);
  return getExpensesSheet.memoSheet;
}

function getTransactionsSheet() {
  if (getTransactionsSheet.memoSheet) {
    return getTransactionsSheet.memoSheet;
  }
  getTransactionsSheet.memoSheet =
      SpreadsheetApp.getActive().getSheetByName(transactionsSheetName);
  return getTransactionsSheet.memoSheet;
}

function getBanklistSheet() {
  if (getBanklistSheet.memoSheet) {
    return getBanklistSheet.memoSheet;
  }
  getBanklistSheet.memoSheet =
      SpreadsheetApp.getActive().getSheetByName(banklistSheetName);
  return getBanklistSheet.memoSheet;
}

function getDailySheet() {
  if (getDailySheet.memoSheet) {
    return getDailySheet.memoSheet;
  }
  getDailySheet.memoSheet =
      SpreadsheetApp.getActive().getSheetByName(dailySheetName);
  return getDailySheet.memoSheet;
}

function getCreditcardSheet() {
  if (getCreditcardSheet.memoSheet) {
    return getCreditcardSheet.memoSheet;
  }
  getCreditcardSheet.memoSheet =
      SpreadsheetApp.getActive().getSheetByName(creditcardSheetName);
  return getCreditcardSheet.memoSheet;
}

function getCreditcardListSheet() {
  if (getCreditcardListSheet.memoSheet) {
    return getCreditcardListSheet.memoSheet;
  }
  getCreditcardListSheet.memoSheet =
      SpreadsheetApp.getActive().getSheetByName(creditcardListSheetName);
  return getCreditcardListSheet.memoSheet;
}

// シートを取得する
function getSheet(sheetName) {
  var pairs = {};
  pairs[categorySheetName] = getCategorySheet();
  pairs[expensesSheetName] = getExpensesSheet();
  pairs[transactionsSheetName] = getTransactionsSheet();
  pairs[banklistSheetName] = getBanklistSheet();
  pairs[dailySheetName] = getDailySheet();
  pairs[creditcardSheetName] = getCreditcardSheet();
  pairs[creditcardListSheetName] = getCreditcardListSheet();
  return pairs[sheetName];
}

// 特定のリストのメモ化
function getAllCategories() {
  if (getAllCategories.memolist) {
    return getAllCategories.memolist;
  }
  var sheet = getCategorySheet();
  getAllCategories.memolist = sheet.getDataRange().getValues();
  return getAllCategories.memolist;
}

function getMainCategories() {
  if (getMainCategories.memolist) {
    return getMainCategories.memolist;
  }
  var allCategories = getAllCategories();
  getMainCategories.memolist =
      allCategories.map(function(arr) { return arr[0]; });
  return getMainCategories.memolist;
}

function getTransactionTypes() {
  if (getTransactionTypes.memolist) {
    return getTransactionTypes.memolist;
  }
  var sheet = getBanklistSheet();
  var array = sheet.getDataRange().getValues();
  getTransactionTypes.memolist = array[0].slice(1);
  return getTransactionTypes.memolist;
}

function getBanks() {
  if (getBanks.memolist) {
    return getBanks.memolist;
  }
  var sheet = getBanklistSheet();
  var array = sheet.getDataRange().getValues();
  getBanks.memolist = array[1].slice(1);
  return getBanks.memolist;
}

/**
 * シートを開いたときに実行される
 */
function onOpen() {
  var categorySheet = getCategorySheet();
  var expensesSheet = getExpensesSheet();
  var transactionsSheet = getTransactionsSheet();
  var banklistSheet = getBanklistSheet();

  // expenses シートにメインカテゴリ 入力規則を設定する
  setValidationMainCategories();

  // expenses シートにクレジットカードの入力規則を設定する
  setValidationCreditcards();

  // transactions シートに入力規則を設定する
  setValidationTransactionsTypes();

  // expenses シート、transactions シートをソート、空白行の中身を削除
  clearContentsOfBlankCells(expensesSheet, 1);
  clearContentsOfBlankCells(transactionsSheet, 1);

  // クレジットカードの集計結果を入力する
  writeCreditcardEntries();

  // クレジットカードの支払いエントリを transactions シートに書き込む
  writeCreditcardWithdrawal();
}

/**
 * セルの値を変更したときに実行される
 *
 * @param {object} e event object
 */
function onEdit(e) {
  // 変更セルの sheet, sheetName
  var sheet = e.source.getActiveSheet();
  var sheetName = sheet.getName();

  // 変更セルの row, col
  var row = e.range.getRow();
  var col = e.range.getColumn();

  // expenses シート
  if (sheetName === expensesSheetName) {
    // メインカテゴリを選択時にサブカテゴリの入力規則を設定
    if (col === 3) {
      setValidationSubcategories(sheet, row, e.value);
    }

    // データ追加時に計上日の計算式を設定
    if (!(sheet.getRange(row, 1).isBlank()) &&
        sheet.getRange(row, 9).isBlank()) {
      setFormulaOfPurchaseDate(sheet, row, e.value);
    }
  }

  // transactions シート
  if (sheetName === transactionsSheetName) {
    // 取引種類を選択時に「どこから」「どこへ」の入力規則を設定
    if (col === 2) {
      setValidationTransactions(sheet, row, e.value);
    }

    // 転記用の計算式を設定
    if (!(sheet.getRange(row, 1).isBlank()) &&
        sheet.getRange(row, 7).isBlank()) {
      setFormulaOfTransactionComment(sheet, row, e.value);
    }

    // 月間内訳での集計用の計算式を設定
    if (!(sheet.getRange(row, 1).isBlank()) &&
        sheet.getRange(row, 8).isBlank()) {
      setFormulaOfTransactionCommentLeft(sheet, row, e.value);
    }
  }

  // daily シートで表示月を選択
  if (sheetName === dailySheetName) {
    if (row === 1 && col === 1) {
      setCategoriesToDailySheet(sheet);
      setExpensesNotes(sheet, e.value);
      setFormulaOfDailySheetSum(sheet, e.value);
    }
  }
}

/**
 * daily シートで集計月の日数に合わせて sum 関数を設定する
 *
 * @param {object} sheet
 * @param {string} dateSerial
 */
function setFormulaOfDailySheetSum(sheet, dateSerial) {
  // 月の最終日を求める
  var unixtime = (dateSerial - 25569) * 86400000;
  var date = new Date(unixtime);
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  var lastDate = date.getDate();

  // var m = Date.parse(date);
  // m.setMonth(m.getMonth() + 1);
  // m.setDate(0);
  // var lastDate = m.getDate();

  var lastCol = '';
  switch (lastDate) {
    case 28:
      lastCol = 'AE';
      break;
    case 29:
      lastCol = 'AF';
      break;
    case 30:
      lastCol = 'AG';
      break;
    case 31:
      lastCol = 'AH';
      break;
  }

  // 計算式を設定する範囲を指定
  var row = 3;
  var col = 3;
  sheet.getRange(row, col, sheet.getLastRow()).clearContent();

  // =sum($D4:$AH4)
  for (row = 3; row <= sheet.getLastRow(); row++) {
    var formula = '=SUM($D' + row + ':$' + lastCol + row + ')';
    sheet.getRange(row, col).setFormula(formula);
  }
}

/**
 * expenses シートのメインカテゴリ列に入力規則を設定する
 * onOpen() で呼び出す
 */
function setValidationMainCategories() {
  var mainCategories = getMainCategories();
  var rule = SpreadsheetApp.newDataValidation()
                 .requireValueInList(mainCategories, true)
                 .build();
  var sheet = getExpensesSheet();
  var column = sheet.getRange(2, 3, sheet.getLastRow() + 50);
  column.clearDataValidations();
  column.setDataValidation(rule);
}

/**
 * expenses シートのカード区分列にクレジットカードの入力規則を設定する
 * onOpen() で呼び出す
 */
function setValidationCreditcards() {
  var cardNames = getCreditcardNames();
  var rule = SpreadsheetApp.newDataValidation()
                 .requireValueInList(cardNames, true)
                 .build();
  var sheet = getExpensesSheet();
  var column = sheet.getRange(2, 7, sheet.getLastRow() + 50);
  column.clearDataValidations();
  column.setDataValidation(rule);
}

/**
 * transactions シートの取引種類列に入力規則を設定する
 * onOpen() で呼び出す
 */
function setValidationTransactionsTypes() {
  var transactionTypes = getTransactionTypes();
  var rule = SpreadsheetApp.newDataValidation()
                 .requireValueInList(transactionTypes, true)
                 .build();
  var sheet = getTransactionsSheet();
  var column = sheet.getRange(2, 2, sheet.getLastRow() + 50);
  column.clearDataValidations();
  column.setDataValidation(rule);
}

/**
 * 空白行のセルに入っている数式などを削除する
 * onOpen() で呼び出す
 *
 * @param {Sheet} sheet
 * @param {number} col 空白行かどうか判定する列
 */
function clearContentsOfBlankCells(sheet, col) {
  var maxRow = sheet.getMaxRows();
  var maxCol = sheet.getMaxColumns();

  // sort する
  sheet.getRange(2, 1, maxRow - 1, maxCol).sort({column: col, ascending: true});

  var firstBlankRow = 2;
  for (var i = 2; i < maxRow; i++) {
    if (sheet.getRange(i, col).isBlank()) {
      firstBlankRow = i;
      break;
    }
  }
  var range =
      sheet.getRange(firstBlankRow, 1, maxRow - firstBlankRow + 1, maxCol);
  range.clearContent();
}

/**
 * メインカテゴリを指定すると、D 列にサブカテゴリを
 * 要素とした入力規則を設定する。
 *
 * @param {Sheet} sheet
 * @param {number} row
 * @param {string} mainCategory
 */
function setValidationSubcategories(sheet, row, mainCategory) {
  var allCategories = getAllCategories();

  var subCategoryRange = sheet.getRange(row, 4);
  subCategoryRange.clearDataValidations();

  // 既存の値を削除した場合は D 列の値を削除する
  // 値を削除した場合、e.value に {'oldValue': 'hoge'} が入る
  if (typeof mainCategory === 'object') {
    subCategoryRange.clearContent();
  }

  for (var i = 0; i < allCategories.length; i++) {
    if (allCategories[i][0] === mainCategory) {
      // 入力規則を設定する
      // 配列の最初はメインカテゴリが入るので slice(1) で index 1 以降を取り出す
      var rule = SpreadsheetApp.newDataValidation()
                     .requireValueInList(allCategories[i].slice(1), true)
                     .build();
      subCategoryRange.setDataValidation(rule);
      break;
    }
  }
}

/**
 * 新しいデータを追加すると I 列に計上日を求める数式を設定する。
 *
 * @param {Sheet} sheet
 * @param {number} row
 * @param {string} date
 */
function setFormulaOfPurchaseDate(sheet, row, date) {
  var cell = sheet.getRange(row, 9);

  // 既存の値を削除した場合は I 列の値を削除する
  // 値を削除した場合、e.value に {'oldValue': 'hoge'} が入る
  if (typeof date === 'object') {
    cell.clearContent();
    return;
  }

  // =IF(ISBLANK(H2),A2,H2)
  var formula = '=IF(ISBLANK(H' + row + '),A' + row + ',H' + row + ')';
  cell.setFormula(formula);
}

/**
 * 取引種類を指定すると、それに応じて入力規則、値を設定する。
 *
 * @param {Sheet} sheet
 * @param {number} row
 * @param {string} transactionType
 */
function setValidationTransactions(sheet, row, transactionType) {
  var transactionTypes = getTransactionTypes();

  // 銀行名のリスト
  var banks = getBanks();

  // '現金'
  var cash = banks[0];

  var banksRule = SpreadsheetApp.newDataValidation()
                      .requireValueInList(banks, true)
                      .build();

  var from = sheet.getRange(row, 3);
  var to = sheet.getRange(row, 4);

  from.clearDataValidations();
  to.clearDataValidations();

  from.clearContent();
  to.clearContent();

  switch (transactionType) {
    case '現金引出':
      from.setDataValidation(banksRule);
      to.setValue(cash);
      break;

    case '現金預入':
      from.setValue(cash);
      to.setDataValidation(banksRule);
      break;

    case '引落':
    case '振込':
    case '手数料':
      from.setDataValidation(banksRule);
      break;

    case '口座振替':
    case '調整':
      from.setDataValidation(banksRule);
      to.setDataValidation(banksRule);
      break;
  }
}

/**
 * transactions シートの転記用セルに関数を設定する
 *
 * @param {Sheet} sheet
 * @param {number} row
 * @param {string} value
 */
function setFormulaOfTransactionComment(sheet, row, value) {
  var cell = sheet.getRange(row, 7);

  // 既存の値を削除した場合は G 列の値を削除する
  // 値を削除した場合、e.value に {'oldValue': 'hoge'} が入る
  if (typeof value === 'object') {
    cell.clearContent();
    return;
  }

  // =IF(ISBLANK($F8), $B8, CONCATENATE($B8,"(",$F8,")"))
  var formula = '=IF(ISBLANK($F' + row + '),' +
      '$B' + row + ',' +
      'CONCATENATE($B' + row + ',"(",$F' + row + ',")"))';
  cell.setFormula(formula);
}

/**
 * transactions シートの月間内訳集計用セルに関数を設定する
 *
 * @param {Sheet} sheet
 * @param {number} row
 * @param {string} value
 */
function setFormulaOfTransactionCommentLeft(sheet, row, value) {
  var cell = sheet.getRange(row, 8);

  // 既存の値を削除した場合は G 列の値を削除する
  // 値を削除した場合、e.value に {'oldValue': 'hoge'} が入る
  if (typeof value === 'object') {
    cell.clearContent();
    return;
  }

  // =LEFT($F95,2)
  var formula = '=LEFT($F' + row + ', 2)';
  cell.setFormula(formula);
}


/**
 * daily シートにメインカテゴリ、サブカテゴリを記載する
 *
 * @param {Sheet} sheet
 */
function setCategoriesToDailySheet(sheet) {
  var allCategories = getAllCategories();
  var row = 3;
  var col = 1;

  // 既に入っている値を削除
  sheet.getRange(row, col, sheet.getLastRow()).clearContent();
  sheet.getRange(row, col + 1, sheet.getLastRow()).clearContent();

  // カテゴリを記入
  for (var i = 0; i < allCategories.length; i++) {
    for (var j = 0; j < allCategories[i].length; j++) {
      if (allCategories[i][j]) {
        sheet.getRange(row, col).setValue(allCategories[i][0]);
        sheet.getRange(row, col + 1).setValue(allCategories[i][j]);

        //サブカテゴリの行のフォントカラーを変更
        if (allCategories[i][0] !== allCategories[i][j]) {
          sheet.getRange(row, col, 1, sheet.getMaxColumns())
              .setFontColor('gray');
        } else {
          sheet.getRange(row, col, 1, sheet.getMaxColumns())
              .setFontColor('black');
        }
        row++;
      }
    }
  }
}

/**
 * expenses シートからすべてのエントリを取得する
 *
 * @return {array}
 */
function getAllExpenses() {
  var sheet = getExpensesSheet();

  // タイトル行をスキップするため slice(1)
  var arr = sheet.getDataRange().getValues().slice(1);

  // null, undefined を除外する
  arr = arr.filter(function(x) {
    if (x) {
      return x;
    }
  });
  return arr;
}

/**
 * 指定した range のセルにメモを記載する
 *
 * @param {Range} range
 * @param {string} note
 */
function addNote(range, note) {
  var existentNote = range.getNote();
  if (existentNote) {
    range.setNote(existentNote + ',' + note);
  } else {
    range.setNote(note);
  }
}

/**
 * expenses シートで入力した店名を daily シートの該当セルにメモとして記載する
 *
 * @param {Sheet} sheet
 * @param {number} begin  2016/07/01, 2016/08/01 など日付のシリアル値
 */
function setExpensesNotes(sheet, begin) {
  var unixtime = (begin - 25569) * 86400000;
  var beginDate = new Date(unixtime);
  var year = beginDate.getFullYear();
  var month = beginDate.getMonth();

  var allExpenses = getAllExpenses();

  // 年、月が同じエントリのみを抽出する
  var targetMonthExpenses = allExpenses.filter(function(row) {
    return (row[0].getFullYear() === year && row[0].getMonth() === month);
  });

  // daily シート B3 から下のリスト
  var categoriesArray =
      sheet.getRange(3, 2, sheet.getDataRange().getLastRow()).getValues();

  // 2 次元配列を flatten
  var categories = categoriesArray.reduce(function(prev, curr) {
    return prev.concat(curr);
  });

  sheet.getDataRange().clearNote();

  // 対象セルの初期値は D3
  var rowIndex = 3;
  var colIndex = 4;

  for (var i = 0; i < targetMonthExpenses.length; i++) {
    // 店名 index 4, 品名 index 5 が入っているか？
    var shop = targetMonthExpenses[i][4];
    var goods = targetMonthExpenses[i][5];
    var note = '';

    if (shop && goods) {
      note = shop + '(' + goods + ')';
    } else if (shop) {
      note = shop;
    } else if (goods) {
      note = goods;
    } else {
      continue;
    }

    var main = targetMonthExpenses[i][2];
    var sub = targetMonthExpenses[i][3];

    var rowOffset = 0;
    var colOffset = 0;

    // サブカテゴリ index 3 が入っているか？
    if (!sub) {
      // サブカテゴリなし -> メインカテゴリを検索する
      rowOffset = categories.indexOf(main);
    } else {
      // サブカテゴリあり -> メインカテゴリ以降でサブカテゴリを検索する
      rowOffset = categories.indexOf(sub, categories.indexOf(main));
    }

    // 日付は初期値が 1 なので -1 する
    // 10 日の場合、必要な offset は 9
    colOffset = targetMonthExpenses[i][0].getDate() - 1;

    var targetCell = sheet.getRange(rowIndex + rowOffset, colIndex + colOffset);
    addNote(targetCell, note);
  }
}
