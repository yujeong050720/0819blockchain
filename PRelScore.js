const XLSX = require("xlsx");
const path = require("path");

// 파일 경로
const REL_SCORE_PATH = path.join(__dirname, 'db', "RelScoreDB.xlsx");
const P_REL_SCORE_PATH = path.join(__dirname, 'db', "PRelScoreDB.xlsx");

function calcPersonalRelScores() {
    // 1. 데이터 로드
    const wb = XLSX.readFile(REL_SCORE_PATH);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

    // data 구조: [[a, b, 0.5], [a, c, 0.5], [b, c, 0.5], ...]

    // 2. 참가자 추출
    const ids = new Set();
    data.forEach(row => {
        if (row[0] && row[0].toString().trim()) ids.add(row[0].toString().trim());
        if (row[1] && row[1].toString().trim()) ids.add(row[1].toString().trim());
    });
    const participants = Array.from(ids).sort();

    // 3. 개인 관계 점수 계산
    const results = [];
    participants.forEach(id => {
        let total = 0.0;
        let count = 0;

        data.forEach(row => {
            const a = row[0] ? row[0].toString().trim() : null;
            const b = row[1] ? row[1].toString().trim() : null;
            const score = parseFloat(row[2]);

            if (a === id || b === id) {
                total += score;
                count += 1;
            }
        });

        const avg = count > 0 ? total / count : 0.0;
        results.push([id, avg]);
        console.log(`참가자: ${id}, 점수: ${avg}`);
    });

    // 4. 결과 저장
    const newWb = XLSX.utils.book_new();
    const newWs = XLSX.utils.aoa_to_sheet([["ID", "Score"], ...results]);
    XLSX.utils.book_append_sheet(newWb, newWs, "PRelScore");
    XLSX.writeFile(newWb, P_REL_SCORE_PATH);

    console.log("개인관계점수 저장 완료:", P_REL_SCORE_PATH);
    return results;
}

// 실행
calcPersonalRelScores();
