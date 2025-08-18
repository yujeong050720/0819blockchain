// RelScore.js
const XLSX = require('xlsx');
const path = require('path');

// 파일 경로 정의
const CLICK_DB_PATH = path.join(__dirname, 'db', 'clickDB.xlsx');
const REL_SCORE_DB_PATH = path.join(__dirname, 'db', 'RelScoreDB.xlsx');

/**
 * 참여자 목록 추출 함수
 * @returns {string[]} 참여자명 리스트
 */
function getParticipants() {
    try {
        const wb = XLSX.readFile(CLICK_DB_PATH);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const ids = new Set();
        data.forEach(row => {
            if (row) ids.add(row);
            if (row[1]) ids.add(row[1]);
        });
        return Array.from(ids);
    } catch {
        return [];
    }
}

/**
 * 각 참여자의 관계점수 계산 (모든 타인과, 0.0 포함)
 * @returns {Array} [id, 점수] 목록
 */
function calcRelScores() {
    const wb = XLSX.readFile(CLICK_DB_PATH);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

    const participants = getParticipants();
    const scores = [];

    participants.forEach(me => {
        let score = 0;
        participants.forEach(other => {
            if (me === other) return; // 자기 자신 제외
            const meClickedOther = data.some(row => row[0] === me && row[1] === other);
            const otherClickedMe = data.some(row => row === other && row[1] === me);

            if (meClickedOther && otherClickedMe) {
                score += 1.0;
            } else if (meClickedOther || otherClickedMe) {
                score += 0.5;
            } else {
                score += 0.0; // 기록 없으면 0.0
            }
        });
        scores.push([me, score]);
    });
    return scores;
}

/**
 * RelScoreDB.xlsx에 결과 저장
 * @param {Array} scores - [id, 점수] 목록
 */
function saveRelScores(scores) {
    const ws = XLSX.utils.aoa_to_sheet(scores);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, REL_SCORE_DB_PATH);
}

/**
 * 콘솔에 결과 출력
 * @param {Array} scores - [id, 점수] 목록
 */
function printScores(scores) {
    console.log('관계점수 계산 결과:');
    scores.forEach(([id, score]) => {
        console.log(`${id}: ${score}`);
    });
}

// --------------- 직접 실행 명령어 ---------------
if (require.main === module) {
    const scores = calcRelScores();
    printScores(scores);
    saveRelScores(scores);
    console.log(`RelScoreDB.xlsx 파일로 저장 완료`);
}

// 모듈로도 사용 가능하게 export
module.exports = { calcRelScores, saveRelScores, printScores };
