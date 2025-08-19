// server.js
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');

// 점수 계산 및 스마트 컨트랙트 모듈 임포트
const { calcPersonalRelScores } = require('./PRelScore');
const { calcRelPairsScores, savePairScores } = require('./RelScore');
const { saveClickDB } = require('./ClickDB'); // 클릭 기록 저장 함
const { recordOnChain } = require('./smart'); // smart.sol 연동 함수

const app = express();
const server = http.createServer(app);
const io = socketio(server);
///////////////////////////////////////////////////////
// 사용자 소켓 관리
const userSockets = new Map();
const walletToNicknameMap = new Map();

// nameDB 불러오기
// let nameDB = new Map(); // wallet -> nickname
// function loadNameDB() {
//   try {
//     const wb = xlsx.readFile(NAME_DB_PATH);
//     const ws = wb.Sheets[wb.SheetNames[0]];
//     const data = xlsx.utils.sheet_to_json(ws, { header: 1 }).slice(1); // 헤더 제외

//     nameDB.clear();
//     for (const row of data) {
//       const nickname = row[0]?.toString().trim();
//       const wallet = row[1]?.toString().toLowerCase().trim();
//       if (nickname && wallet) nameDB.set(wallet, nickname);
//     }
//     console.log('nameDB 로드 완료:', nameDB.size);
//   } catch (err) {
//     console.error('nameDB 로드 오류:', err);
//   }
// }
// loadNameDB();
const nameDB = new Map();

io.on('connection', (socket) => {
  console.log('클라이언트 연결됨:', socket.id);

  // 사용자 등록
  socket.on('registerSocket', ({ wallet }) => {
    const lowerWallet = wallet.toLowerCase();
    userSockets.set(lowerWallet, socket.id);
    console.log(`소켓 등록: ${lowerWallet} -> ${socket.id}`);
  });

////////////////////////////////////////////////////////////////
  // 채팅 메시지 전송
socket.on('newLink', ({ link, wallet }) => {
  const fromWallet = wallet.toLowerCase();
  console.log(`메시지 수신: ${fromWallet} | ${link}`);

  try {
    // 1️⃣ 개인 관계 점수 계산
    const prel = calcPersonalRelScores(); // { nickname: score, ... }
    const nickname = walletToNicknameMap.get(fromWallet); // 지갑 → 닉네임 매핑 필요
    const userScore = prel[nickname] || 0;

    console.log(`개인 관계 점수: ${userScore}`);

    // 2️⃣ 점수가 0.5 이상이면 HTML에 브로드캐스트
    if (userScore >= 0.5) {
      io.emit('newLink', { link, wallet: fromWallet });
      console.log(`✅ 메시지 브로드캐스트: ${fromWallet}`);
    } else {
      console.log(`❌ 점수 부족으로 메시지 미출력: ${fromWallet}`);
    }
  } catch (err) {
    console.error('점수 계산 오류:', err);
  }
});

  // 링크 클릭 이벤트 처리
  socket.on('linkClicked', ({ fromUser, toUser, link }) => {
    console.log(`링크 클릭: ${fromUser} -> ${toUser} | ${link}`);

    // ---------------------------
    // 클릭 기록 저장 및 점수 계산
    try {
      const prel = calcPersonalRelScores();
      const rel = calcRelPairsScores();
      savePairScores(rel);

      // fromUser = 닉네임 기준
      const score = prel[fromUser] || 0;
      const toSocket = userSockets.get(toUser.toLowerCase());

      if (score >= 0.5) {
        console.log(`✅ 링크 접근 허용: ${toUser} -> ${fromUser} | 점수: ${score}`);

        // 스마트 컨트랙트 기록
        recordOnChain(fromUser, toUser, link);

        // clickDB에 기록
        saveClickDB(fromUser, toUser, link);

        // 클라이언트에게 허용 이벤트 전송
        if (toSocket) {
          io.to(toSocket).emit('linkAccessGranted', { fromUser, link });
        }
      } else {
        console.log(`❌ 링크 접근 거부: ${toUser} -> ${fromUser} | 점수: ${score}`);
        if (toSocket) {
          io.to(toSocket).emit('linkAccessDenied', { fromUser, link, reason: '점수 미달' });
        }
      }
    } catch (err) {
      console.error('링크 클릭 처리 오류:', err);
    }
  });

  // 소켓 연결 해제 시
  socket.on('disconnect', () => {
    for (const [wallet, id] of userSockets.entries()) {
      if (id === socket.id) userSockets.delete(wallet);
    }
    console.log(`클라이언트 연결 해제: ${socket.id}`);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
