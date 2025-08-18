//0819-12:51
// RelScoreServer.js
const express = require("express");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const RelScore = require("./RelScore");

const app = express();
app.use(express.json());

const dbFilePath = path.join(__dirname, "RelScoreDB.xlsx");

// --- 엑셀 저장 함수 ---
function saveRelationsToExcel(filePath, relations) {
  const rows = [];
  for (const from in relations) {
    for (const to in relations[from]) {
      rows.push({
        from,
        to,
        score: relations[from][to],
      });
    }
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "RelScore");
  XLSX.writeFile(wb, filePath);
}

// --- 엑셀 불러오기 ---
function loadRelationsFromExcel(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets["RelScore"];
  const rows = XLSX.utils.sheet_to_json(ws);

  const relations = {};
  rows.forEach(({ from, to, score }) => {
    if (!relations[from]) relations[from] = {};
    relations[from][to] = score;
  });

  return relations;
}

// --- 초기화 ---
let relScore = new RelScore(loadRelationsFromExcel(dbFilePath));

// --- 관계 갱신 API ---
app.post("/click", (req, res) => {
  const { fromUser, toUser } = req.body;

  if (!fromUser || !toUser) {
    return res.status(400).json({ error: "fromUser, toUser 필요" });
  }

  // 1. 관계 반영
  relScore.recordClick(fromUser, toUser);

  // 2. DB에 저장
  saveRelationsToExcel(dbFilePath, relScore.getRelations());

  // 3. 갱신된 값 반환 (= 서버에 실시간 반영)
  return res.json({
    message: "관계점수 갱신 완료",
    updatedRelations: relScore.getRelations(),
  });
});

// --- 관계값 조회 API ---
app.get("/relations", (req, res) => {
  res.json(relScore.getRelations());
});

// 서버 실행
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 RelScore 서버 실행 중: http://localhost:${PORT}`);
});
