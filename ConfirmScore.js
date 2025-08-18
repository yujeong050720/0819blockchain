// ConfirmScore.js
// 인증점수 계산 모듈
// 신규 사용자의 찬성 투표 결과와 링크 클릭, 신규 접속 발생 시 인증점수 업데이트

class ConfirmScore {
  constructor(confirmScores) {
    // confirmScores: { userAddress: score, ... }
    this.scores = confirmScores || {};
  }

  // 신규 유저 가입 시 찬성 투표 비율로 초기 인증점수 설정
  setInitialScore(user, approvalRatio) {
    // approvalRatio: 0 ~ 1 사이, 2/3 이상이면 가입 승인
    this.scores[user] = approvalRatio;
  }

  // 링크 클릭 이벤트 발생 시 인증점수 업데이트
  // toUser는 링크를 공유한 사람, fromUser는 링크 클릭한 사람
  updateScore(toUser, fromUser) {
    if (!this.scores[toUser]) this.scores[toUser] = 0;
    // 간단히 0.01 점수 증가 예시 (임의 값)
    this.scores[toUser] += 0.01;
    if (this.scores[toUser] > 1) this.scores[toUser] = 1;
  }

  // 신규 접속 발생 시 인증점수 증가 예시 함수
  onNewConnection(user) {
    if (!this.scores[user]) this.scores[user] = 0;
    this.scores[user] += 0.005; // 임의 값
    if (this.scores[user] > 1) this.scores[user] = 1;
  }

  // 특정 유저 인증점수 반환
  getScore(user) {
    return this.scores[user] || 0;
  }

  getAllScores() {
    return this.scores;
  }
}

module.exports = ConfirmScore;
