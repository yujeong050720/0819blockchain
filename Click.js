// ClickDB.js
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

// 클릭DB 파일 경로
const clickDBPath = path.join(__dirname, "클릭DB.xlsx");

// ✅ 클릭 기록 불러오기
function loadClicks() {
  if (!fs.existsSync(clickDBPath)) {
    // 파일 없으면 생성
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([]);
    XLSX.utils.book_append_sheet(wb, ws, "Clicks");
    XLSX.writeFile(wb, clickDBPath);
    return [];
  }
  const wb = XLSX.readFile(clickDBPath);
  const ws = wb.Sheets["Clicks"];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws);
}

// ✅ 클릭 기록 저장 함수
function recordClick(fromUser, toUser, link) {
  const data = loadClicks();

  // 새 클릭 데이터 추가
  data.push({
    fromUser,       // 클릭한 지갑
    toUser,         // 링크 공유한 지갑
    link,           // 클릭된 링크
    time: new Date().toISOString(), // 클릭 시간
  });

  // 다시 파일에 씀
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Clicks");
  XLSX.writeFile(wb, clickDBPath);
}

module.exports = { recordClick, loadClicks };
