// server.js

const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

// ClickDB.js 에서 데이터 저장/삭제 함수 불러오기
const {
  recordVerifierClick,
  removeVerifierClicksForCandidate,
} = require('./Click');  // db 폴더 안에 있다고 가정

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static('public')); // public 폴더에 HTML, JS, CSS 파일들

// 닉네임+지갑주소 저장용 엑셀 경로 (db 폴더 내)
const NAME_DB_PATH = path.join(__dirname, 'db', 'nameDB.xlsx');

// --------------------------------
// 닉네임 및 지갑 주소 저장 API
app.post('/saveUser', express.json(), (req, res) => {
  const { nickname, walletAddress } = req.body;
  if (!nickname || !walletAddress)
    return res.status(400).json({ error: '데이터 누락' });

  let workbook, sheetName = 'Sheet1', data = [];

  // 기존 nameDB.xlsx 파일 있으면 읽기
  if (fs.existsSync(NAME_DB_PATH)) {
    workbook = xlsx.readFile(NAME_DB_PATH);
    sheetName = workbook.SheetNames[0];
    data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  }
  // 없으면 새 워크북 생성
  else {
    workbook = xlsx.utils.book_new();
  }

  // 새 사용자 추가
  data.push({ nickname, walletAddress });

  // JSON -> 시트 변환 후 워크북에 반영
  const newSheet = xlsx.utils.json_to_sheet(data);
  workbook.Sheets[sheetName] = newSheet;

  if (!workbook.SheetNames.includes(sheetName))
    workbook.SheetNames.push(sheetName);

  // 엑셀 파일 저장
  xlsx.writeFile(workbook, NAME_DB_PATH);

  res.json({ success: true });
});

// --------------------------------
// 입장 검증 및 투표 상태 관리
const pendingVerifications = {};
const validators = ['0xValidator1', '0xValidator2', '0xValidator3']; // 검증자 주소 예시

const userSockets = new Map();       // 사용자 지갑 주소 -> 소켓ID
const validatorSockets = new Map();  // 검증자 지갑 주소 -> 소켓ID

io.on('connection', (socket) => {
  console.log('클라이언트 연결됨:', socket.id);

  // 클라이언트가 자신의 지갑 주소 등록
  socket.on('registerWallet', (walletAddr) => {
    userSockets.set(walletAddr.toLowerCase(), socket.id);
    console.log(`사용자 등록: ${walletAddr} -> ${socket.id}`);
  });

  // 검증자 등록 (검증자들은 따로 등록)
  socket.on('registerValidator', (validatorAddr) => {
    validatorSockets.set(validatorAddr.toLowerCase(), socket.id);
    console.log(`검증자 등록: ${validatorAddr} -> ${socket.id}`);
  });

  // 1) 신규 사용자 입장 요청 받음
  socket.on('requestEntry', ({ wallet, nickname }) => {
    const candidate = wallet.toLowerCase();
    if (pendingVerifications[candidate]) return; // 이미 요청중인 경우 무시

    pendingVerifications[candidate] = {
      validators: [...validators],
      votes: {},
      nickname,
      link: '', // 필요시 링크도 저장
    };

    // 모든 검증자에게 승인 요청 이벤트 전송
    for (const vAddr of validators) {
      const vSocketId = validatorSockets.get(vAddr.toLowerCase());
      if (vSocketId) {
        io.to(vSocketId).emit('verificationRequested', {
          candidate,
          nickname,
          message: `${nickname}(${candidate}) 님이 입장 요청 중입니다.`,
          validators,
        });
      }
    }
    console.log(`입장 요청: ${candidate} 닉네임: ${nickname}`);
  });

  // 2) 검증자 투표 처리
  socket.on('submitVote', ({ candidate, validator, approve }) => {
    candidate = candidate.toLowerCase();
    validator = validator.toLowerCase();

    if (!pendingVerifications[candidate]) return;
    if (!pendingVerifications[candidate].validators.includes(validator)) return;

    pendingVerifications[candidate].votes[validator] = !!approve;

    const totalVotes = Object.keys(pendingVerifications[candidate].votes).length;
    const totalValidators = pendingVerifications[candidate].validators.length;

    // 모든 검증자 투표 완료되면 최종 처리
    if (totalVotes === totalValidators) {
      finalizeVerification(candidate);
    }
  });

  // 소켓 연결 해제 시 맵에서 제거
  socket.on('disconnect', () => {
    for (const [wallet, id] of userSockets.entries()) {
      if (id === socket.id) userSockets.delete(wallet);
    }
    for (const [validator, id] of validatorSockets.entries()) {
      if (id === socket.id) validatorSockets.delete(validator);
    }
  });
});

// --------------------------------
// 투표 최종 결과 판단 및 사용자에게 통보
function finalizeVerification(candidate) {
  const data = pendingVerifications[candidate];
  if (!data) return;

  const approvals = Object.values(data.votes).filter(v => v).length;
  const total = data.validators.length;
  const approved = approvals * 3 >= total * 2; // 2/3 이상 찬성일 경우 승인

  if (approved) {
    // 승인 시 검증자 클릭 기록 저장
    for (const [validator, vote] of Object.entries(data.votes)) {
      if (vote) recordVerifierClick(validator, candidate, data.link);
    }
    console.log(`✅ ${candidate} 승인 (${approvals}/${total})`);
  } else {
    // 거절 시 승인 기록 삭제
    removeVerifierClicksForCandidate(candidate, data.link);
    console.log(`❌ ${candidate} 거절 (${approvals}/${total})`);
  }

  // 해당 후보자 소켓 ID 얻어 결과 전송
  const socketId = userSockets.get(candidate);
  if (socketId) {
    io.to(socketId).emit('verificationCompleted', {
      candidate,
      approved,
    });
  }

  delete pendingVerifications[candidate];
}

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
