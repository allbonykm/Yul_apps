// ========================================
// Yul Apps - Google Apps Script
// 자전거 + 줄넘기 + 영어퀴즈 통합 API
// ========================================

var SPREADSHEET_ID = '1qVPTPL1aWV2izwRHm9Go0WztI3is9ibIjgJallVDlzI';

function doGet(e) {
  try {
    var action = e.parameter.action || 'bike';
    
    if (action === 'getJumprope') {
      return getJumpropeData();
    } else if (action === 'getEnglishQuiz') {
      return getEnglishQuizData();
    } else {
      // 기존 자전거 최고 속도 API
      return getBikeMaxSpeed();
    }
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var action = e.parameter.action || 'bike';
    
    if (action === 'jumprope') {
      return saveJumpropeRecord(e);
    } else if (action.startsWith('englishQuiz_')) {
      return handleEnglishQuizPost(action, e.parameter.data);
    } else {
      // 기존 자전거 기록 API
      return saveBikeRecord(e);
    }
  } catch (error) {
    return ContentService
      .createTextOutput('ERROR: ' + error.toString())
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

// ========================================
// 영어 퀴즈 관련 함수 (NEW!)
// ========================================

function getEnglishQuizData() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  try {
    // 단어뱅크 시트
    var wordBankSheet = ss.getSheetByName('단어뱅크');
    if (!wordBankSheet) {
      wordBankSheet = ss.insertSheet('단어뱅크');
      wordBankSheet.getRange('A1:B1').setValues([['word', 'meaning']]);
    }
    
    // 복습문제 시트
    var reviewSheet = ss.getSheetByName('복습문제');
    if (!reviewSheet) {
      reviewSheet = ss.insertSheet('복습문제');
      reviewSheet.getRange('A1:E1').setValues([['word', 'status', 'nextReviewDate', 'streak', 'addedDate']]);
    }
    
    // 완벽숙지 시트
    var masteredSheet = ss.getSheetByName('완벽숙지');
    if (!masteredSheet) {
      masteredSheet = ss.insertSheet('완벽숙지');
      masteredSheet.getRange('A1:B1').setValues([['word', 'masteredDate']]);
    }
    
    // 데이터 읽기
    var wordBankData = wordBankSheet.getDataRange().getValues();
    var reviewData = reviewSheet.getDataRange().getValues();
    var masteredData = masteredSheet.getDataRange().getValues();
    
    // 단어뱅크 (헤더 제외)
    var wordBank = [];
    for (var i = 1; i < wordBankData.length; i++) {
      if (wordBankData[i][0]) {
        wordBank.push({
          word: wordBankData[i][0],
          meaning: wordBankData[i][1]
        });
      }
    }
    
    // 복습문제 리스트 (헤더 제외)
    var reviewList = [];
    for (var i = 1; i < reviewData.length; i++) {
      if (reviewData[i][0]) {
        reviewList.push({
          word: reviewData[i][0],
          status: reviewData[i][1],
          nextReviewDate: reviewData[i][2],
          streak: reviewData[i][3] || 0,
          addedDate: reviewData[i][4]
        });
      }
    }
    
    // 완벽숙지 리스트 (헤더 제외)
    var masteredList = [];
    for (var i = 1; i < masteredData.length; i++) {
      if (masteredData[i][0]) {
        masteredList.push({
          word: masteredData[i][0],
          masteredDate: masteredData[i][1]
        });
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        wordBank: wordBank,
        reviewList: reviewList,
        masteredList: masteredList
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleEnglishQuizPost(action, data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  try {
    if (action === 'englishQuiz_addReview') {
      return addToReviewList(ss, data);
    } else if (action === 'englishQuiz_updateReview') {
      return updateReviewItem(ss, data);
    } else if (action === 'englishQuiz_moveMastered') {
      return moveToMastered(ss, data);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 복습리스트에 추가
function addToReviewList(ss, data) {
  var sheet = ss.getSheetByName('복습문제');
  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: '복습문제 시트가 없습니다' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var item = JSON.parse(data);
  sheet.appendRow([
    item.word,
    item.status,
    item.nextReviewDate,
    item.streak || 0,
    item.addedDate
  ]);
  
  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// 복습리스트 항목 업데이트
function updateReviewItem(ss, data) {
  var sheet = ss.getSheetByName('복습문제');
  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: '복습문제 시트가 없습니다' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var item = JSON.parse(data);
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === item.word) {
      sheet.getRange(i + 1, 2, 1, 4).setValues([[
        item.status,
        item.nextReviewDate,
        item.streak || 0,
        item.addedDate || values[i][4]
      ]]);
      return ContentService
        .createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  // 없으면 추가
  return addToReviewList(ss, data);
}

// 완벽숙지로 이동
function moveToMastered(ss, data) {
  var item = JSON.parse(data);
  var word = item.word;
  
  // 복습문제에서 삭제
  var reviewSheet = ss.getSheetByName('복습문제');
  if (reviewSheet) {
    var reviewData = reviewSheet.getDataRange().getValues();
    for (var i = reviewData.length - 1; i >= 1; i--) {
      if (reviewData[i][0] === word) {
        reviewSheet.deleteRow(i + 1);
        break;
      }
    }
  }
  
  // 완벽숙지에 추가
  var masteredSheet = ss.getSheetByName('완벽숙지');
  if (!masteredSheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: '완벽숙지 시트가 없습니다' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var today = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
  masteredSheet.appendRow([word, today]);
  
  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// 줄넘기 관련 함수
// ========================================

function getJumpropeData() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('줄넘기');
  
  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, total: 0, days: 0, records: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var data = sheet.getDataRange().getValues();
  var total = 0;
  var uniqueDates = {};
  var records = [];
  
  // 첫 번째 행은 헤더이므로 i=1부터 시작
  // 헤더: 날짜 | 시간 | 줄넘기횟수 | 누적총합 | 10000개까지
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[0]) { // 날짜가 있는 행만
      var date = row[0];
      var time = row[1];
      var count = parseInt(row[2]) || 0;
      var cumTotal = parseInt(row[3]) || 0;
      
      // 마지막 행의 누적총합이 최신 값
      if (i === data.length - 1) {
        total = cumTotal;
      }
      
      // 고유 날짜 카운트
      var dateStr = Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      uniqueDates[dateStr] = true;
      
      records.push({
        date: dateStr,
        time: time,
        count: count,
        total: cumTotal
      });
    }
  }
  
  var days = Object.keys(uniqueDates).length;
  
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      total: total,
      days: days,
      records: records
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveJumpropeRecord(e) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('줄넘기');
  
  // 시트가 없으면 생성
  if (!sheet) {
    sheet = ss.insertSheet('줄넘기');
    sheet.appendRow(['날짜', '시간', '줄넘기횟수', '누적총합', '10000개까지']);
  }
  
  var now = new Date();
  var date = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var time = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm:ss');
  var count = parseInt(e.parameter.count) || 0;
  var total = parseInt(e.parameter.total) || 0;
  var remaining = parseInt(e.parameter.remaining) || (10000 - total);
  
  // 새 행 추가
  sheet.appendRow([date, time, count, total, remaining]);
  
  return ContentService
    .createTextOutput('SUCCESS')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ========================================
// 자전거 관련 함수 (기존 코드)
// ========================================

function getBikeMaxSpeed() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  var maxSpeed = 0.0;
  
  for (var i = 1; i < data.length; i++) {
    var speed = parseFloat(data[i][3]);
    if (!isNaN(speed) && speed > maxSpeed) {
      maxSpeed = speed;
    }
  }
  
  return ContentService
    .createTextOutput(maxSpeed.toString())
    .setMimeType(ContentService.MimeType.TEXT);
}

function saveBikeRecord(e) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getActiveSheet();
  
  var date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var time = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HH:mm:ss');
  var distance = e.parameter.distance || '';
  var speed = parseFloat(e.parameter.speed) || 0;
  
  sheet.appendRow([date, time, distance, speed]);
  
  return ContentService
    .createTextOutput('SUCCESS')
    .setMimeType(ContentService.MimeType.TEXT);
}
