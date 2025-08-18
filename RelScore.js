// RelScore.js
// 관계점수 계산 모듈
// 한 사용자가 다른 사용자의 링크를 클릭하면 관계점수를 갱신

class RelScore {
  constructor(relations) {
    // relations: { userA: { userB: score, ...}, ... }
    this.relations = relations || {};
  }

  // 링크 클릭 기록: fromUser가 toUser 링크 클릭
  recordClick(fromUser, toUser) {
    if (!this.relations[fromUser]) {
      this.relations[fromUser] = {};
    }
    if (!this.relations[toUser]) {
      this.relations[toUser] = {};
    }

    // 단방향 클릭 점수 0.5 설정
    this.relations[fromUser][toUser] = 0.5;

    // 혹시 반대 방향 클릭이 있으면 쌍방향 1.0 으로 업그레이드
    if (this.relations[toUser][fromUser] === 0.5) {
      this.relations[fromUser][toUser] = 1.0;
      this.relations[toUser][fromUser] = 1.0;
    }
  }

  // 두 사용자 사이 관계 점수 반환
  getScore(userA, userB) {
    if (
      this.relations[userA] &&
      typeof this.relations[userA][userB] === "number"
    ) {
      return this.relations[userA][userB];
    }
    return 0.0; // 관계 없음
  }

  // 전체 관계 데이터 반환
  getRelations() {
    return this.relations;
  }
}

module.exports = RelScore;
