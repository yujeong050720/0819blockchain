// 0819-12:50
// ConfirmScore.js
// 인증점수 관리 및 DB 저장/불러오기
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

class ConfirmScore {
  constructor(data) {
    this.totalUsers = data?.totalUsers || 0;
    this.clicks = {};   // { toUser: Set(fromUsers) }
    this.scores = {};   // { user: score }

    // 기존 데이터 복원
    if (data?.clicks) {
      for (const user in data.clicks) {
        this.clicks[user] = new Set(data.clicks[user]);
      }
    }
    if (data?.scores) {
      this.scores = data.scores;
    }
  }

  // 신규 유저 입장
  addNewUser(user) {
    this.totalUsers += 1;

    if (!this.clicks[user]) {
      this.clicks[user] = new Set();
    }

    this.recalculateScores();
  }

  // 링크 클릭 기록 (고유 클릭만 인정됨)
  recordClick(fromUser, toUser) {
    if (!this.clicks[toUser]) this.clicks[toUser] = new Set();
    this.clicks[toUser].add(fromUser); // Set이라 중복 방지
    this.recalculateScores();
  }

  // 점수 재계산: score = (고유 클릭 수) / (총 유저 수)
  recalculateScores() {
    for (const user in this.clicks) {
      const receivedClicks = this.clicks[user].size;
      this.scores[user] =
        this.totalUsers > 0 ? receivedClicks / this.totalUsers : 0;
    }
  }

  // 특정 유저 점수 반환
  getScore(user) {
    return this.scores[user] || 0;
  }

  // 전체 점수 반환
  getAllScores() {
    return this.scores;
  }

  // 내부 데이터 추출 (엑셀 저장용)
  exportData() {
    return {
      totalUsers: this.totalUsers,
      clicks: Object.fromEntries(
        Object.entries(this.clicks).map(([u, set]) => [u, Array.from(set)])
      ),
      scores: this.scores,
    };
  }
}

// ===============================
// 엑셀 저장/불러오기 기능
// ===============================
const confirmScorePath = path.join(__dirname, "ConfirmScore.xlsx");

// 저장
function saveConfirmScores(confirmScore) {
  const data = confirmScore.exportData();

  // 시트1: 전체 점수
  const scoreRows = Object.keys(data.scores).map((user) => ({
    user,
    score: data.scores[user],
  }));
  const wsScores = XLSX.utils.json_to_sheet(scoreRows);

  // 시트2: 고유 클릭 기록
  const clickRows = [];
  for (const user in data.clicks) {
    data.clicks[user].forEach((from) => {
      clickRows.push({ toUser: user, fromUser: from });
    });
  }
  const wsClicks = XLSX.utils.json_to_sheet(clickRows);

  // 시트3: 메타데이터 (totalUsers)
  const wsMeta = XLSX.utils.json_to_sheet([{ totalUsers: data.totalUsers }]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsScores, "Scores");
  XLSX.utils.book_append_sheet(wb, wsClicks, "Clicks");
  XLSX.utils.book_append_sheet(wb, wsMeta, "Meta");

  XLSX.writeFile(wb, confirmScorePath);
}

// 불러오기
function loadConfirmScores() {
  if (!fs.existsSync(confirmScorePath)) return new ConfirmScore({});
  const wb = XLSX.readFile(confirmScorePath);

  // 점수 복원
  const wsScores = wb.Sheets["Scores"];
  const wsClicks = wb.Sheets["Clicks"];
  const wsMeta = wb.Sheets["Meta"];

  const scores = {};
  if (wsScores) {
    XLSX.utils.sheet_to_json(wsScores).forEach(({ user, score }) => {
      scores[user] = parseFloat(score);
    });
  }

  const clicks = {};
  if (wsClicks) {
    XLSX.utils.sheet_to_json(wsClicks).forEach(({ toUser, fromUser }) => {
      if (!clicks[toUser]) clicks[toUser] = [];
      clicks[toUser].push(fromUser);
    });
  }

  let totalUsers = 0;
  if (wsMeta) {
    const meta = XLSX.utils.sheet_to_json(wsMeta);
    totalUsers = meta[0]?.totalUsers || 0;
  }

  return new ConfirmScore({ totalUsers, clicks, scores });
}

module.exports = {
  ConfirmScore,
  saveConfirmScores,
  loadConfirmScores,
};
