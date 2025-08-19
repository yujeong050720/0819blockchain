const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const clickDBPath = path.join(__dirname, 'db', "clickDB.xlsx");
const prelScoreDBPath = path.join(__dirname, 'db', "PRelScoreDB.xlsx");

// A열, B열 값 추출 함수 (0-based 열 인덱스)
function getColumnValues(ws, colIndex) {
  const range = XLSX.utils.decode_range(ws['!ref']);
  const values = [];
  for (let row = range.s.r + 1; row <= range.e.r; row++) { // +1 해서 헤더 제외 가능
    const cellAddress = { c: colIndex, r: row };
    const cellRef = XLSX.utils.encode_cell(cellAddress);
    const cell = ws[cellRef];
    values.push(cell ? cell.v : null);
  }
  return values;
}

// 1. clickDB 엑셀 전체 시트에서 이름 존재 여부 확인 (A열: fromUser, B열: toUser 가정)
function isNameInClickDB(name) {
  if (!fs.existsSync(clickDBPath)) return false;
  const wb = XLSX.readFile(clickDBPath);

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    // A열과 B열 데이터 추출
    const fromUsers = getColumnValues(ws, 0); // A열
    const toUsers = getColumnValues(ws, 1);   // B열

    for (let i = 0; i < fromUsers.length; i++) {
      if (fromUsers[i] === name || toUsers[i] === name) {
        return true;
      }
    }
  }
  return false;
}

// 2. PRelScoreDB 파일 로드
function loadPRelScoreDB() {
  if (!fs.existsSync(prelScoreDBPath)) return null;
  return XLSX.readFile(prelScoreDBPath);
}

// 3. PRelScoreDB 전체 시트에서 이름 및 score >= 0.5 확인 (A열: 이름, B열: score 가정)
function isNameScoreAboveThreshold(name, threshold = 0.5) {
  const wb = loadPRelScoreDB();
  if (!wb) return false;

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    const names = getColumnValues(ws, 0);   // A열
    const scores = getColumnValues(ws, 1);  // B열

    for (let i = 0; i < names.length; i++) {
      if (names[i] === name && parseFloat(scores[i]) >= threshold) {
        return true;
      }
    }
  }
  return false;
}

// 4. 클릭 기록 불러오기 ("Clicks" 시트)
function loadClicks() {
  if (!fs.existsSync(clickDBPath)) return [];
  const wb = XLSX.readFile(clickDBPath);
  const ws = wb.Sheets["Clicks"];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws);
}

// 5. 클릭 기록 저장 함수
function recordClick(fromUser, toUser, link) {
  const data = loadClicks();

  data.push({
    fromUser,
    toUser,
    link,
    time: new Date().toISOString(),
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Clicks");
  XLSX.writeFile(wb, clickDBPath);
}

// 6. 전체 프로세스 함수
function processClick(fromUser, toUser, link) {
  if (!isNameInClickDB(fromUser)) {
    console.log(`fromUser "${fromUser}" not found in clickDB`);
    return;
  }

  if (!isNameScoreAboveThreshold(fromUser)) {
    console.log(`fromUser "${fromUser}" score below threshold in PRelScoreDB`);
    return;
  }

  recordClick(fromUser, toUser, link);
  console.log("Click recorded.");
}

module.exports = { processClick, recordClick, loadClicks };
