// Confirm.js
// 검증자 후보 계산 모듈
// 인증점수 기준으로 검증자 선출

class Confirm {
  constructor(confirmScores) {
    // confirmScores: { userAddress: score, ... }
    this.scores = confirmScores || {};
  }

  // 정회원 수를 넣으면 규칙에 따라 검증자 수 결정
  getValidatorCount(numMembers) {
    if (numMembers < 4) return numMembers;
    if (numMembers <= 10) return 3;
    if (numMembers <= 99) return 5;
    return 10;
  }

  // 인증점수 내림차순 정렬 후 상위 n명 검증자 반환
  selectValidators() {
    const allUsers = Object.keys(this.scores);
    const numMembers = allUsers.length;
    const validatorCount = this.getValidatorCount(numMembers);

    // 사용자 목록을 점수 내림차순 정렬
    allUsers.sort((a, b) => this.scores[b] - this.scores[a]);

    // 상위 n명 검증자 반환
    return allUsers.slice(0, validatorCount);
  }
}

module.exports = Confirm;
