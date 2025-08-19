const xlsx = require('xlsx');
const path = require('path');

// 채팅 로그 파일 경로
const CHAT_DB_PATH = path.join(__dirname, 'db', 'chatLogsDB.xlsx');

function loadChatLogs() {
  try {
    console.log('📂 chatLogs 로드 시작:', CHAT_DB_PATH);
    const wb = xlsx.readFile(CHAT_DB_PATH);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(ws, { header: 1 }).slice(1);

    // [{ fromUser, message, timestamp }]
    const logs = data.map(row => ({
      fromUser: row[0],
      message: row[1],
      timestamp: row[2] || new Date().toISOString(),
    }));

    

    console.log('✅ chatLogs 로드 완료, 총', logs.length, '개');
    console.log(logs);
    return logs;
  } catch (err) {
    console.error('❌ chatLogs 로드 오류:', err);
    return [];
  }
}

function saveChatLog({ fromUser, message }) {
  try {
    console.log('💾 chatLogs 저장 시작:', { fromUser, message });
    const wb = xlsx.readFile(CHAT_DB_PATH);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(ws, { header: 1 });

    // 새 행 추가
    const timestamp = new Date().toISOString();
    data.push([fromUser, message, timestamp]);

    // 시트 업데이트
    const newWs = xlsx.utils.aoa_to_sheet(data);
    wb.Sheets[wb.SheetNames[0]] = newWs;
    xlsx.writeFile(wb, CHAT_DB_PATH);
    console.log('✅ chatLogs 저장 완료');
  } catch (err) {
    console.error('❌ chatLogs 저장 오류:', err);
  }
}

module.exports = {
  loadChatLogs,
  saveChatLog

};
