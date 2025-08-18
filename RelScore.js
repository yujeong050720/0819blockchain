const XLSX = require('xlsx');
const path = require('path');

const CLICK_DB_PATH = path.join(__dirname, 'db', 'clickDB.xlsx');
const REL_SCORE_DB_PATH = path.join(__dirname, 'db', 'RelScoreDB.xlsx');

/**
 * clickDB.xlsx를 기반으로 알파벳순 관계쌍 점수 목록 생성
 * @returns {Array} [idA, idB, 점수] 목록 (idA < idB)
 */
function calcRelPairsScores() {
    // 1. 데이터 로드
    const wb = XLSX.readFile(CLICK_DB_PATH);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

    // 2. 모든 참여자 추출 (A열/B열에서만)
    const ids = new Set();
    data.forEach(row => {
        if (row[0] && row[0].toString().trim()) ids.add(row[0].toString().trim());
        if (row[1] && row[1].toString().trim()) ids.add(row[1].toString().trim());
    });
    const participants = Array.from(ids).sort();

    // 3. 관계쌍 점수 계산
    const results = [];
    for (let i = 0; i < participants.length - 1; i++) {
        for (let j = i + 1; j < participants.length; j++) {
            const idA = participants[i];
            const idB = participants[j];

            const aToB = data.some(row =>
                row[0] && row[1] &&
                row[0].toString().trim() === idA &&
                row[1].toString().trim() === idB
            );
            const bToA = data.some(row =>
                row[0] && row[1] &&
                row[0].toString().trim() === idB &&
                row[1].toString().trim() === idA
            );

            let score = 0.0;
            if (aToB && bToA) score = 1.0;
            else if (aToB || bToA) score = 0.5;
            // 둘 다 없으면 0.0 유지

            results.push([idA, idB, score]);
            console.log(`쌍: ${idA}, ${idB} / 점수: ${score}`);
        }
    }
    return results;
}

/**
 * 결과를 RelScoreDB.xlsx에 저장 ([a, b, 점수] 목록)
 * @param {Array} pairsScores
 */
function savePairScores(pairsScores) {
    const ws = XLSX.utils.aoa_to_sheet(pairsScores);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, REL_SCORE_DB_PATH);
}

// 실행부
if (require.main === module) {
    const pairsScores = calcRelPairsScores();
    savePairScores(pairsScores);
}

module.exports = { calcRelPairsScores, savePairScores };
