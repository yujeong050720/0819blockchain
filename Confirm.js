//0819-12:55
// Confirm.js
// 검증자 후보 계산 모듈
// 인증점수 기준으로 검증자 선출
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const Confirm = require('./Confirm');
const ConfirmScore = require('./ConfirmScore');

// 파일 경로
const confirmScorePath = path.join(__dirname, 'ConfirmScore.xlsx');
const validatorPath = path.join(__dirname, 'Validators.xlsx');

// ✅ ConfirmScore 불러오기
function loadConfirmScores(filePath) {
  if (!fs.existsSync(filePath)) return new ConfirmScore({});
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets['ConfirmScore'];
  const rows = XLSX.utils.sheet_to_json(ws);

  const scores = {};
  rows.forEach(({ user, score }) => {
    scores[user] = parseFloat(score);
  });
  return new ConfirmScore(scores);
}

// ✅ Validators 저장
function saveValidators(filePath, validatorList) {
  const rows = validatorList.map(user => ({ user }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Validators');
  XLSX.writeFile(wb, filePath);
}

// ✅ Validators 불러오기
function loadValidators(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets['Validators'];
  const rows = XLSX.utils.sheet_to_json(ws);
  return rows.map(r => r.user);
}

// Express + Socket.io 서버 설정
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

// 현재 검증자 리스트
let currentValidators = loadValidators(validatorPath);

// ✅ 검증자 갱신 API
app.post('/validators/update', (req, res) => {
  const confirmScore = loadConfirmScores(confirmScorePath);
  const confirm = new Confirm(confirmScore.getAllScores());

  const validatorList = confirm.selectValidators();

  saveValidators(validatorPath, validatorList);
  currentValidators = validatorList;

  // 모든 클라이언트에게 새 검증자 목록 실시간 전송
  io.emit('validatorsUpdated', currentValidators);

  res.json({ validators: currentValidators });
});

// ✅ 검증자 조회 API
app.get('/validators/get', (req, res) => {
  res.json({ validators: currentValidators });
});

// ✅ 실시간 연결
io.on('connection', socket => {
  console.log('클라이언트 연결됨');
  socket.emit('validatorsUpdated', currentValidators);
});

// 실행
server.listen(4000, () => {
  console.log('검증자 서버 실행: http://localhost:4000');
});

