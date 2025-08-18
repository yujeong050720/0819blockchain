const XLSX = require("xlsx");
const path = require("path");

// 파일 경로
const CLICK_DB_PATH = path.join(__dirname, "clickDB.xlsx");
const CONFIRM_SCORE_PATH = path.join(__dirname, "ConfirmScoreDB.xlsx");

function calcConfirmScores() {
    // 1. 데이터 로드
    const wb = XLSX.readFile(CLICK_DB_PATH);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

    // 2. 참가자 추출
    const ids = new Set();
    data.forEach(row => {
        if (row[0] && row[0].toString().trim()) ids.add(row[0].toString().trim());
        if (row[1] && row[1].toString().trim()) ids.add(row[1].toString().trim());
    });
    const participants = Array.from(ids).sort();
    const n = participants.length;

    // 3. 참가자별 B열 등장 횟수 세기
    const counts = {};
    participants.forEach(id => counts[id] = 0);

    data.forEach(row => {
        const to = row[1] ? row[1].toString().trim() : null;
        if (to && counts.hasOwnProperty(to)) {
            counts[to] += 1;
        }
    });

    // 4. 인증점수 계산 (횟수 / 전체 참가자 수)
    const results = [];
    participants.forEach(id => {
        const score = n > 0 ? counts[id] / n : 0.0;
        results.push([id, score]);
        console.log(`참가자: ${id}, 인증점수: ${score}`);
    });

    // 5. 결과 저장
    const newWb = XLSX.utils.book_new();
    const newWs = XLSX.utils.aoa_to_sheet([["ID", "ConfirmScore"], ...results]);
    XLSX.utils.book_append_sheet(newWb, newWs, "ConfirmScore");
    XLSX.writeFile(newWb, CONFIRM_SCORE_PATH);

    console.log("인증점수 저장 완료:", CONFIRM_SCORE_PATH);
    return results;
}

// 실행
calcConfirmScores();
