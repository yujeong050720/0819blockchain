// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HyperlinkVerification {
    struct Message {
        uint256 id;
        address sender;
        string content;
    }

    // 개인 관계 점수
    mapping(address => uint256) public relationScore;

    // 인증 점수
    mapping(address => uint256) public confirmScore;

    // 검증자 명단 (동적으로 관리)
    address[] public validators;

    // 메시지 저장
    Message[] public messages;

    // 메시지 클릭 기록
    mapping(uint256 => address[]) public messageClicks;

    // 운영자
    address public owner;

    // 이벤트
    event RelationScoreUpdated(address indexed user, uint256 score);
    event ConfirmScoreUpdated(address indexed user, uint256 score);
    event ValidatorsUpdated(address[] newValidators);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "운영자만 가능");
        _;
    }

    // 서버에서 계산된 개인관계점수 반영
    function setRelationScore(address user, uint256 score) external onlyOwner {
        require(score <= 1e18, "0~1 범위만 인정");
        relationScore[user] = score;
        emit RelationScoreUpdated(user, score);
    }

    // 서버에서 계산된 인증점수 반영
    function setConfirmScore(address user, uint256 score) external onlyOwner {
        require(score <= 1e18, "0~1 범위만 인정");
        confirmScore[user] = score;
        emit ConfirmScoreUpdated(user, score);
    }

    // 서버에서 계산된 최신 검증자 명단 반영
    function updateValidators(address[] calldata validatorList) external onlyOwner {
        delete validators;
        for(uint i=0; i<validatorList.length; i++) {
            validators.push(validatorList[i]);
        }
        emit ValidatorsUpdated(validators);
    }

    // 메시지 전송(로그 남김)
    function sendMessage(string calldata content) external {
        messages.push(Message({
            id: messages.length,
            sender: msg.sender,
            content: content
        }));
    }

    // 메시지 클릭 (메시지 발신자의 관계점수가 0.5 이상이어야 함)
    function clickMessage(uint256 messageId) external {
        require(messageId < messages.length, "잘못된 메시지 ID");
        address senderOfMessage = messages[messageId].sender;
        require(relationScore[senderOfMessage] >= 5e17, "발신자 관계점수 부족");
        messageClicks[messageId].push(msg.sender);
    }

    // 개별 메시지 클릭 가능 여부 확인
    function canClickMessage(uint256 messageId) external view returns (bool) {
        require(messageId < messages.length, "잘못된 메시지 ID");
        address senderOfMessage = messages[messageId].sender;
        return (relationScore[senderOfMessage] >= 5e17);
    }

    // 검증자 리스트 조회
    function getValidators() external view returns (address[] memory) {
        return validators;
    }

    // 메시지 리스트 조회
    function getMessages() external view returns (Message[] memory) {
        return messages;
    }

    // 메시지 클릭자 리스트 조회
    function getClickers(uint256 messageId) external view returns (address[] memory) {
        require(messageId < messages.length, "잘못된 메시지 ID");
        return messageClicks[messageId];
    }
}
