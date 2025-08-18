// PPRelScore.js
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const RelScore = require('./RelScore');


// 관계점수 → Excel 저장
function saveRelationsToExcel(filePath, relScore) {
  const relations = relScore.getRelations();

  const rows = [];
  for (const from in relations) {
    for (const to in relations[from]) {
      rows.push({
        from,
        to,
        score: relations[from][to]
      });
    }
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'RelScore');
  XLSX.writeFile(wb, filePath);
}


// Excel → 관계점수 불러오기
function loadRelationsFromExcel(filePath) {
  if (!fs.existsSync(filePath)) return new RelScore({});
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets['RelScore'];
  const rows = XLSX.utils.sheet_to_json(ws);

  const relations = {};
  rows.forEach(({ from, to, score }) => {
    if (!relations[from]) relations[from] = {};
    relations[from][to] = score;
  });

  return new RelScore(relations);
}


// 🔹 개인관계점수 계산
function calculatePersonalRelationScores(relations) {
  const personalScores = {};

  for (const user in relations) {
    const connected = relations[user];
    const values = Object.values(connected);

    if (values.length === 0) {
      personalScores[user] = 0;
    } else {
      const sum = values.reduce((a, b) => a + b, 0);
      personalScores[user] = sum / values.length;
    }
  }

  return personalScores;
}


// 🔹 개인관계점수 Excel 저장
function savePersonalScoresToExcel(filePath, personalScores) {
  const rows = Object.entries(personalScores).map(([user, score]) => ({
    user,
    personalScore: score
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'PersonalScores');
  XLSX.writeFile(wb, filePath);
}


// 사용 예시
const relFilePath = path.join(__dirname, 'RelScore.xlsx');
const pRelFilePath = path.join(__dirname, 'PRelScoreDB.xlsx');

// 1. 기존 관계 불러오기
let relScore = loadRelationsFromExcel(relFilePath);

// 2. 새로운 클릭 이벤트 반영
relScore.recordClick('Alice', 'Bob');
relScore.recordClick('Bob', 'Alice'); // Alice-Bob 서로 관계 강화
relScore.recordClick('Alice', 'Charlie'); // Alice → Charlie 관계 추가

// 3. 관계점수 Excel 저장
saveRelationsToExcel(relFilePath, relScore);

// 4. 개인관계점수 계산
const relations = relScore.getRelations();
const personalScores = calculatePersonalRelationScores(relations);

// 5. 개인관계점수 Excel 저장
savePersonalScoresToExcel(pRelFilePath, personalScores);

console.log("✅ Relations:", relations);
console.log("✅ Personal Scores:", personalScores);
