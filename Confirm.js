const XLSX = require("xlsx");
const path = require("path");

// 파일 경로
const CONFIRM_SCORE_PATH = path.join(__dirname, 'db', "ConfirmScoreDB.xlsx");

function selectVerifiers() {
    // 1. 데이터 로드
    const wb = XLSX.readFile(CONFIRM_SCORE_PATH);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

    // 첫 행 ["ID", "ConfirmScore"] 제거
    const rows = data.slice(1);

    // 2. 멤버와 점수 불러오기
    const members = rows.map(row => ({
        id: row[0].toString().trim(),
        score: parseFloat(row[1])
    }));

    const n = members.length;

    // 3. 정렬 (점수 내림차순, 점수 같으면 알파벳 사전순 오름차순)
    members.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.id.localeCompare(b.id);
    });

    // 4. 검증자 수 결정 (기본 규칙)
    let verifierCount = 0;
    if (n < 4) verifierCount = n;
    else if (n <= 10) verifierCount = 3;
    else if (n <= 99) verifierCount = 5;
    else verifierCount = 10;

    // 5. 검증자 후보 선정 (score >= 0.5)
    const candidates = members.filter(m => m.score >= 0.5);

    // 실제 검증자 = candidates 중 상위 verifierCount명
    const verifiers = candidates.slice(0, verifierCount);

    // 6. 결과 출력
    console.log("=== 검증자 선정 결과 ===");
    if (verifiers.length === 0) {
        console.log("⚠️ 조건(0.5 이상)에 맞는 검증자가 없습니다.");
    } else {
        verifiers.forEach((v, idx) => {
            console.log(`${idx + 1}. ${v.id} (점수: ${v.score})`);
        });
    }

    return verifiers;
}

// 실행
selectVerifiers();
