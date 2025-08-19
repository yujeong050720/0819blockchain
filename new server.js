// server.js

const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');


// ClickDB.js 에서 데이터 저장/삭제 함수 불러오기
const {
  recordClick,
  recordVerifierClick,
  removeVerifierClicksForCandidate,
} = require('./Click');  // 현재 server.js와 같은 폴더 내 Click.js 파일 불러옴

// 인증점수, 관계점수 계산 및 검증자 선정 함수 불러오기
const { ConfirmScore } = require('./ConfirmScore');
const { calcRelScores, saveRelScores } = require('./RelScore');
const { selectVerifiers } = require('./selectVerifiers');


// chatLogsDB 경로 및 함수 (채팅/링크 기록 관련)
const CHAT_LOGS_DB_PATH = path.join(__dirname, 'db', 'ClickDB.xlsx');

function loadLinks() {
  // chatLogsDB가 없으면 초기화
  if (!fs.existsSync(CHAT_LOGS_DB_PATH)) {
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet([]);
    xlsx.utils.book_append_sheet(wb, ws, 'Links');
    xlsx.writeFile(wb, CHAT_LOGS_DB_PATH);
  }
  const wb = xlsx.readFile(CHAT_LOGS_DB_PATH);
  const ws = wb.Sheets['Links'];
  return xlsx.utils.sheet_to_json(ws);
}

function saveLink(link, wallet) {
  const data = loadLinks();
  data.push({ link, wallet, time: new Date().toISOString() });
  const ws = xlsx.utils.json_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Links');
  xlsx.writeFile(wb, CHAT_LOGS_DB_PATH);
}


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
// 점수 조회 API (page2에서 점수 요청용)

// 인증점수(ConfirmScore) 조회
app.get('/api/certification/:wallet', (req, res) => {
  const filePath = path.join(__dirname, 'db', 'ConfirmScoreDB.xlsx');
  if (!fs.existsSync(filePath)) return res.json({ score: 0 });

  const wb = xlsx.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(ws);
  const wallet = req.params.wallet.toLowerCase();

  const record = data.find(row => String(row.ID).toLowerCase() === wallet);
  res.json({ score: record ? parseFloat(record.ConfirmScore) : 0 });
});

// 관계점수(RelScore) 조회
app.get('/api/relscore/:wallet', (req, res) => {
  const filePath = path.join(__dirname, 'db', 'RelScoreDB.xlsx');
  if (!fs.existsSync(filePath)) return res.json({ score: 0 });

  const wb = xlsx.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(ws, { header: 1 });

  const wallet = req.params.wallet.toLowerCase();
  let score = 0;
  for (const row of data) {
    if (row[0] && String(row[0]).toLowerCase() === wallet) {
      score = row[1];
      break;
    }
  }
  res.json({ score: score || 0 });
});


// --------------------------------
// 입장 검증 및 투표 상태 관리

// pendingVerifications 구조체: 후보자 주소별로 검증자, 투표결과 저장함
const pendingVerifications = {};

// 검증자 목록 초기값 (동적 선정 가능하도록 추후 코드에서 재정의)
let validators = ['0xValidator1', '0xValidator2', '0xValidator3'];

// 사용자 및 검증자 소켓 관리
const userSockets = new Map();        // 사용자 지갑 주소 -> 소켓ID 
const validatorSockets = new Map();   // 검증자 지갑 주소 -> 소켓ID 


io.on('connection', (socket) => {
  console.log('클라이언트 연결됨:', socket.id);

  // 클라이언트가 자신의 지갑 주소 등록 (사용자 / 검증자 모두 등록 가능하게)
  socket.on('registerWallet', (walletAddr) => {
    userSockets.set(walletAddr.toLowerCase(), socket.id);
    console.log(`사용자 등록: ${walletAddr} -> ${socket.id}`);
  });

  // 검증자 등록 (검증자들은 따로 등록)
  socket.on('registerValidator', (validatorAddr) => {
    validatorSockets.set(validatorAddr.toLowerCase(), socket.id);
    console.log(`검증자 등록: ${validatorAddr} -> ${socket.id}`);
  });


  // 1) 신규 사용자 입장 요청 받음 (검증자 동적 선정 및 점수 갱신 포함)
  socket.on('requestEntry', async ({ wallet, nickname }) => {
    const candidate = wallet.toLowerCase();

    if (pendingVerifications[candidate]) return; // 이미 요청중인 경우 무시

    // 입장 요청 시점에 최신 인증점수 기준으로 검증자 동적 선정
    try {
      await new Promise(resolve => setTimeout(resolve, 100)); // 잠시 대기 (필요 시)
      // 점수 계산 최신화
      await ConfirmScore();
      await calcRelScores();

      // 상위 검증자 목록 동적할당
      validators = selectVerifiers().map(v => v.id);

      if (validators.length === 0) {
        console.log("⚠️ 조건에 맞는 검증자가 없어 입장 요청 중단");
        socket.emit('verificationCompleted', {
          candidate,
          approved: false,
          reason: '검증자 부족',
        });
        return;
      }

      // 후보자에 검증자 목록, 투표 기록 등 초기화
      pendingVerifications[candidate] = {
        validators: [...validators],
        votes: {},
        nickname,
        link: '', // 필요 시 입장 요청 시 링크도 저장 가능
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

      console.log(`입장 요청: ${candidate} 닉네임: ${nickname} | 검증자: ${validators}`);

    } catch (err) {
      console.error("requestEntry 처리 중 에러:", err);
    }
  });


  // 2) 검증자 투표 처리 (중복 투표 방지 포함)
  socket.on('submitVote', ({ candidate, validator, approve }) => {
    candidate = candidate.toLowerCase();
    validator = validator.toLowerCase();

    if (!pendingVerifications[candidate]) return;
    if (!pendingVerifications[candidate].validators.includes(validator)) return;

    // 중복 투표 방지
    if (pendingVerifications[candidate].votes[validator] !== undefined) return;

    pendingVerifications[candidate].votes[validator] = !!approve;

    const totalVotes = Object.keys(pendingVerifications[candidate].votes).length;
    const totalValidators = pendingVerifications[candidate].validators.length;

    // 모든 검증자 투표 완료되면 최종 처리
    if (totalVotes === totalValidators) {
      finalizeVerification(candidate);
    }
  });


  // 3) 채팅 및 링크 공유: 초기 데이터 보내기
  socket.emit('initData', loadLinks());

  // 새 링크 등록 이벤트 수신 처리
  socket.on('newLink', ({ link, wallet }) => {
    saveLink(link, wallet);
    const newData = { link, wallet, time: new Date().toISOString() };
    io.emit('newLink', newData);
  });

  // 4) 클릭 이벤트 처리: fromUser 가 toUser 의 링크 클릭 시 기록
  socket.on('linkClicked', ({ fromUser, toUser, link }) => {
    recordClick(fromUser, toUser, link);

    // 클릭 기록 후 점수 재계산 및 저장 (실시간 또는 배치 처리 가능)
    ConfirmScore();
    const relScores = calcRelScores();
    saveRelScores(relScores);

    // 필요시 클라이언트에게 점수 갱신 알림(별도 구현 필요)
  });


  // 5) 소켓 연결 해제 시 맵에서 제거
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
// 투표 최종 결과 판단 및 사용자/검증자에게 통보
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

  // 후보자에게 결과 전송
  const socketId = userSockets.get(candidate);
  if (socketId) {
    io.to(socketId).emit('verificationCompleted', {
      candidate,
      approved,
    });
  }
  // 검증자들에게도 결과 알림 전송
  data.validators.forEach((v) => {
    const vId = validatorSockets.get(v.toLowerCase());
    if (vId) {
      io.to(vId).emit('verificationResult', { candidate, approved });
    }
  });

  // 처리 완료 후 pending 목록에서 제거
  delete pendingVerifications[candidate];
}


const PORT = 3000;
server.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
