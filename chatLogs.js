// chatLogs.js  
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 사용할 엑셀 파일 경로
const excelFile = path.join(__dirname, 'chatLogsDB.xlsx');

// ✅ links.xlsx 파일을 불러오기
function loadLinks() {
  if (!fs.existsSync(excelFile)) {
    // 파일이 없으면 새로 생성
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([]);
    XLSX.utils.book_append_sheet(wb, ws, 'Links');
    XLSX.writeFile(wb, excelFile);
  }

  const wb = XLSX.readFile(excelFile);
  const ws = wb.Sheets['Links'];
  return XLSX.utils.sheet_to_json(ws);
}

// ✅ 새로운 링크 추가 저장
function saveLink(link, wallet) {
  const data = loadLinks();
  data.push({ link, wallet, time: new Date().toISOString() });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Links');
  XLSX.writeFile(wb, excelFile);
}

// ✅ Socket.io 연결
io.on('connection', (socket) => {
  console.log('클라이언트 연결됨');

  // 접속한 클라이언트에게 현재 데이터 전송
  socket.emit('initData', loadLinks());

  // 새로운 링크 업로드 이벤트 처리
  socket.on('newLink', ({ link, wallet }) => {
    saveLink(link, wallet);
    const newData = { link, wallet, time: new Date().toISOString() };
    // 모든 클라이언트에게 브로드캐스트
    io.emit('newLink', newData);2
  });
});

// 정적 파일 서비스 (예: public/index.html)
app.use(express.static('public'));

server.listen(3000, () => {
  console.log('서버 실행: http://localhost:3000');
});
