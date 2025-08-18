//0819-12:55
// Confirm.js
// 검증자 후보 계산 모듈
// 인증점수 기준으로 검증자 선출
// ============================================================
// 1) ConfirmScoreDB.xlsx 인증점수 DB 기반
// 2) 상위 N명 검증자 선출 규칙 포함 (Confirm.js 기능)
// 3) 신규 사용자 입장 요청 시 검증자들에게 실시간 팝업 전송
// 4) 검증자 투표 수집, 2/3 이상 찬성 시 인증점수 반영
// ============================================================

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const { ConfirmScore, saveConfirmScores, loadConfirmScores } = require("./ConfirmScore"); // 인증점수 관리 모듈

// ============================================================
// Confirm.js 기능: 검증자 선출 규칙 모듈
// ============================================================
class Confirm {
  constructor(confirmScores) {
    this.scores = confirmScores || {};
  }

  // 멤버 수에 따른 검증자 수 구하기
  getValidatorCount(numMembers) {
    if (numMembers < 4) return numMembers;
    else if (numMembers <= 10) return 3;
    else if (numMembers <= 99) return 5;
    else return 10;
  }

  // 인증점수 내림차순 정렬 후 상위 N명 반환
  selectValidators() {
    const allUsers = Object.keys(this.scores);
    const numMembers = allUsers.length;
    const validatorCount = this.getValidatorCount(numMembers);

    return allUsers
      .sort((a, b) => this.scores[b] - this.scores[a])
      .slice(0, validatorCount);
  }
}

// ============================================================
// Express + Socket.io 서버
// ============================================================
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

// 투표 상태 관리
let pendingVerifications = {};

// ✅ 현재 검증자 목록 계산
function getCurrentValidators() {
  const confirmScore = loadConfirmScores();
  const confirm = new Confirm(confirmScore.getAllScores());
  return confirm.selectValidators();
}

// ✅ 신규 사용자 입장 요청 API
app.post("/verify/init", (req, res) => {
  const { newUser, link } = req.body;
  const validators = getCurrentValidators();

  if (validators.length === 0) {
    return res.status(400).json({ error: "현재 검증자가 없음" });
  }

  // 투표 상태 저장
  pendingVerifications[newUser] = {
    validators,
    votes: {}, // { validatorAddr: true/false }
    link,
  };

  // 검증자들에게 투표 요청 이벤트 실시간 전송
  io.emit("verificationRequested", {
    candidate: newUser,
    link,
    message: `${newUser} 지갑이 ${link}를 공유하며 채팅방 입장을 요청합니다.`,
    validators,
  });

  res.json({ msg: "검증 요청 발송됨", validators });
});

// ✅ 검증자들이 투표 제출 API
app.post("/verify/vote", (req, res) => {
  const { candidate, validator, approve } = req.body;

  if (!pendingVerifications[candidate]) {
    return res.status(400).json({ error: "해당 후보의 검증 요청 없음" });
  }
  if (!pendingVerifications[candidate].validators.includes(validator)) {
    return res.status(400).json({ error: "이 검증자는 해당 투표 권한 없음" });
  }

  pendingVerifications[candidate].votes[validator] = !!approve;

  // 모든 검증자 투표 완료 시
  const totalVotes = Object.keys(pendingVerifications[candidate].votes).length;
  const requiredVotes = pendingVerifications[candidate].validators.length;

  if (totalVotes === requiredVotes) {
    finalizeVerification(candidate);
  }

  res.json({ msg: "투표 기록 완료" });
});

// ✅ 투표 최종 처리
function finalizeVerification(candidate) {
  const data = pendingVerifications[candidate];
  if (!data) return;

  const approvals = Object.values(data.votes).filter((v) => v).length;
  const total = data.validators.length;

  const approved = approvals * 3 >= total * 2; // 2/3 이상

  if (approved) {
    console.log(`✅ ${candidate} 승인 (${approvals}/${total})`);

    // 인증점수 반영 = (찬성 수) / (전체 유저 수)
    const confirmScore = loadConfirmScores();
    confirmScore.addNewUser(candidate);
    confirmScore.scores[candidate] = approvals / confirmScore.totalUsers;
    saveConfirmScores(confirmScore);

    io.emit("verificationCompleted", {
      candidate,
      approved: true,
      score: confirmScore.getScore(candidate),
    });
  } else {
    console.log(`❌ ${candidate} 거절됨 (${approvals}/${total})`);

    io.emit("verificationCompleted", {
      candidate,
      approved: false,
    });
  }

  delete pendingVerifications[candidate];
}

// ✅ 현재 검증자 리스트 조회 API
app.get("/validators/get", (req, res) => {
  const validators = getCurrentValidators();
  res.json({ validators });
});

// ✅ 클라이언트 연결 시 현재 검증자 목록 전송
io.on("connection", (socket) => {
  console.log("🔗 클라이언트 연결됨");
  socket.emit("validatorsUpdated", getCurrentValidators());
});

// 서버 실행
server.listen(4000, () => {
  console.log("✅ 검증자 서버 실행 중: http://localhost:4000");
});

  console.log('검증자 서버 실행: http://localhost:4000');
});

