// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RelationMessage {
    struct Message {
        uint256 id;
        address sender;
        string content;
    }

    // 사용자 개인관계점수를 저장
    mapping(address => uint256) public relationScore;

    // 메시지 저장
    Message[] public messages;

    // 메시지를 누른 기록
    mapping(uint256 => address[]) public messageClicks;

    // 개인관계점수 set 함수 (운영자만 실행 가능하도록 이 부분은 예시)
    function setRelationScore(address user, uint256 score) public {
        require(score <= 1e18, "점수는 0~1 사이로 설정하세요"); // 0~1 (18 decimals)
        relationScore[user] = score;
    }

    // 메시지 보내기
    function sendMessage(string memory content) public {
        messages.push(Message({
            id: messages.length,
            sender: msg.sender,
            content: content
        }));
    }

    // 메시지를 클릭 (x 주소의 관계점수가 0.5 이상일 때만)
    function clickMessage(uint256 messageId) public {
        require(messageId < messages.length, "잘못된 메시지 ID");
        address senderOfMessage = messages[messageId].sender;
        require(relationScore[senderOfMessage] >= 5e17, "보낸 사람의 관계점수가 낮아 클릭 불가"); // 0.5 (18 decimals)
        messageClicks[messageId].push(msg.sender);
    }

    // 메시지 클릭 가능 여부 check 함수
    function canClickMessage(uint256 messageId) public view returns (bool) {
        address senderOfMessage = messages[messageId].sender;
        return (relationScore[senderOfMessage] >= 5e17);
    }

    // 메시지 리스트 리턴
    function getMessages() public view returns (Message[] memory) {
        return messages;
    }
}
