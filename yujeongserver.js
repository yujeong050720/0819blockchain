// server.js
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const xlsx = require('xlsx');

// 점수 계산 모듈
const { calcPersonalRelScores } = require('./PRelScore');
const { calcRelPairsScores, savePairScores } = require('./RelScore');
const { saveClickDB } = require('./saveClick');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// 정적 파일 제공 (html1, html2 등)
app.use(express.static(path.join(__dirname, 'road')));

///////////////////////////////////////////////////////
// 사용자 소켓 관리 (닉네임 → 소켓ID)
const userSockets = new Map();

// wallet → nickname 매핑
const NAME_DB_PATH = path.join(__dirname, 'db', 'nameDB.xlsx');
const nameDB = new Map();

function loadNameDB() {
  try {
    const wb = xlsx.readFile(NAME_DB_PATH);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(ws, { header: 1 }).slice(1);

    nameDB.clear();
    for (const row of data) {
      const nickname = row[0]?.toString().trim();
      const wallet = row[1]?.toString().toLowerCase().trim();
      if (nickname && wallet) nameDB.set(wallet, nickname);
    }
    console.log('✅ nameDB 로드 완료:', nameDB.size);
  } catch (err) {
    console.error('❌ nameDB 로드 오류:', err);
  }
}
loadNameDB();

///////////////////////////////////////////////////////
// 채팅 DB 읽기/쓰기
const CHAT_LOGS_PATH = path.join(__dirname, 'db', 'chatLogsDB.xlsx');

function loadChatLogs() {
  try {
    const wb = xlsx.readFile(CHAT_LOGS_PATH);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(ws, { header: 1 }).slice(1);
    return data.map(row => ({
      fromUser: row[0],
      toUser: row[1],
      message: row[2]
    }));
  } catch (err) {
    console.error('❌ 채팅 로그 로드 오류:', err);
    return [];
  }
}

function saveChatLog({ fromUser, toUser, message }) {
  try {
    const wb = xlsx.readFile(CHAT_LOGS_PATH);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const arr = xlsx.utils.sheet_to_json(ws, { header: 1 });
    arr.push([fromUser, toUser, message]);
    const newWs = xlsx.utils.aoa_to_sheet(arr);
    wb.Sheets[wb.SheetNames[0]] = newWs;
    xlsx.writeFile(wb, CHAT_LOGS_PATH);
  } catch (err) {
    console.error('❌ 채팅 로그 저장 오류:', err);
  }
}

///////////////////////////////////////////////////////
// 사용자 정보 조회 API (html2에서 불러오기용)
app.get('/users', (req, res) => {
  res.json(Array.from(userSockets.keys()));
});

///////////////////////////////////////////////////////
// 소켓 이벤트 처리
io.on('connection', (socket) => {
  console.log('클라이언트 연결됨:', socket.id);

  // 접속 직후 채팅 기록 전송
  const logs = loadChatLogs();
  socket.emit('chatLogs', logs);

  // 새 메시지 수신
  socket.on('sendMessage', ({ fromUser, toUser, message }) => {
    saveChatLog({ fromUser, toUser, message });

    // 수신자에게 전달
    const toSocket = userSockets.get(toUser);
    if (toSocket) io.to(toSocket).emit('receiveMessage', { fromUser, message });

    // 발신자에게도 확인용 전달
    socket.emit('receiveMessage', { fromUser, message });
  });

  ////////////////////////////////////////////////////////////////
  // 새 링크 업로드 (닉네임 기준)
  socket.on('newLink', async ({ link, wallet }) => {
    const lowerWallet = wallet.toLowerCase();
    const nickname = nameDB.get(lowerWallet);

    if (!nickname) {
      console.log(`❌ 닉네임 없음 (wallet=${lowerWallet})`);
      return;
    }

    try {
      const prel = calcPersonalRelScores();
      const userScore = prel[nickname] || 0;
      console.log(`개인 관계 점수: ${nickname} = ${userScore}`);

      if (userScore >= 0.5) {
        io.emit('newLink', { link, fromUser: nickname });
        console.log(`✅ 메시지 브로드캐스트: ${nickname}`);
      } else {
        console.log(`❌ 점수 부족으로 메시지 미출력: ${nickname}`);
      }
    } catch (err) {
      console.error('점수 계산/메시지 처리 오류:', err);
    }
  });

  ////////////////////////////////////////////////////
  // 링크 클릭 이벤트 (닉네임 기준)
  socket.on('linkClicked', async ({ fromUser, toUser, link }) => {
    console.log(`링크 클릭: ${fromUser} -> ${toUser} | ${link}`);
    try {
      const prel = calcPersonalRelScores();
      const rel = calcRelPairsScores();
      savePairScores(rel);

      const score = prel[fromUser] || 0;
      const toSocket = userSockets.get(toUser);

      if (score >= 0.5) {
        console.log(`✅ 링크 접근 허용: ${toUser} -> ${fromUser} | 점수: ${score}`);
        if (toSocket) io.to(toSocket).emit('linkAccessGranted', { fromUser, link });
      } else {
        console.log(`❌ 링크 접근 거부: ${toUser} -> ${fromUser} | 점수: ${score}`);
        if (toSocket) io.to(toSocket).emit('linkAccessDenied', { fromUser, link, reason: '점수 미달' });
      }
    } catch (err) {
      console.error('링크 클릭 처리 오류:', err);
    }
  });

  ////////////////////////////////////////////////////
  // 연결 해제
  socket.on('disconnect', () => {
    for (const [nickname, id] of userSockets.entries()) {
      if (id === socket.id) userSockets.delete(nickname);
    }
    console.log(`클라이언트 연결 해제: ${socket.id}`);
  });
});

///////////////////////////////////////////////////////
// 서버 실행
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
