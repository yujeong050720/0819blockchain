// 0819-12:50
// ConfirmScore.js
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const ConfirmScore = require('./ConfirmScore');

// ✅ 인증 점수를 엑셀 파일로 저장
function saveConfirmScoresToExcel(filePath, confirmScore) {
  const scores = confirmScore.getAllScores(); // {user: score, ...}
  const rows = Object.keys(scores).map(user => ({
    user: user,
    score: scores[user]
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ConfirmScore');
  XLSX.writeFile(wb, filePath);
}

// ✅ 엑셀에서 인증 점수 불러오기 → ConfirmScore 인스턴스 생성
function loadConfirmScoresFromExcel(filePath) {
  if (!fs.existsSync(filePath)) {
    // 파일이 없으면 빈 ConfirmScore 반환
    return new ConfirmScore({});
  }

  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets['ConfirmScore'];
  const rows = XLSX.utils.sheet_to_json(ws);

  const scores = {};
  rows.forEach(({ user, score }) => {
    scores[user] = parseFloat(score);
  });

  return new ConfirmScore(scores);
}

// ✅ 사용 예시
const filePath = path.join(__dirname, 'ConfirmScore.xlsx');

// 1. 기존 데이터 불러오기
let confirmScore = loadConfirmScoresFromExcel(filePath);

// 2. 새로운 유저 초기 등록 (가입 투표 찬성률 반영)
confirmScore.setInitialScore('Alice', 0.7);  // 70% 승인
confirmScore.setInitialScore('Bob', 0.9);    // 90% 승인

// 3. 이벤트 발생
confirmScore.updateScore('Alice', 'Bob');     // Bob이 Alice 링크 클릭 → Alice 점수 +0.01
confirmScore.onNewConnection('Alice');        // Alice 새 접속 → 점수 +0.005

// 4. 저장
saveConfirmScoresToExcel(filePath, confirmScore);

console.log("Confirm Scores saved:", confirmScore.getAllScores());
