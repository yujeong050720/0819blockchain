// contracts/TrustedChat.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TrustedChat {
    /* ----------------------------- Ownership ----------------------------- */
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnerTransferred(address(0), msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero addr");
        emit OwnerTransferred(owner, newOwner);
        owner = newOwner;
    }

    event OwnerTransferred(address indexed prevOwner, address indexed newOwner);

    /* -------------------------- TrustScore logic -------------------------- */
    // 개인신뢰점수 (예: 0~10000 사이로 저장하면 소수 없이도 표현 가능)
    // 여기서는 1e4 = 1.0000 로 간주 (즉, 5000 = 0.5)
    mapping(address => uint256) private trustScoreBP; // basis points(만분율)로 저장
    uint256 public thresholdBP = 5000; // 기본 임계값: 0.5

    event TrustScoreSet(address indexed user, uint256 scoreBP);
    event TrustScoresBatchSet(uint256 count);
    event ThresholdChanged(uint256 prevBP, uint256 newBP);

    /// @notice 단일 사용자 점수 설정 (서버에서 호출)
    function setTrustScore(address user, uint256 scoreBP_) external onlyOwner {
        // 예: scoreBP_는 0~10000 범위를 권장
        trustScoreBP[user] = scoreBP_;
        emit TrustScoreSet(user, scoreBP_);
    }

    /// @notice 배치로 여러 사용자 점수 설정 (서버에서 호출)
    function setTrustScoresBatch(address[] calldata users, uint256[] calldata scoresBP) external onlyOwner {
        require(users.length == scoresBP.length, "length mismatch");
        for (uint256 i = 0; i < users.length; i++) {
            trustScoreBP[users[i]] = scoresBP[i];
            emit TrustScoreSet(users[i], scoresBP[i]);
        }
        emit TrustScoresBatchSet(users.length);
    }

    /// @notice 임계값 변경 (만분율 기준)
    function setThresholdBP(uint256 newThresholdBP) external onlyOwner {
        uint256 prev = thresholdBP;
        thresholdBP = newThresholdBP;
        emit ThresholdChanged(prev, newThresholdBP);
    }

    /// @notice 주소의 현재 신뢰 점수 조회 (만분율)
    function getTrustScoreBP(address user) external view returns (uint256) {
        return trustScoreBP[user];
    }

    /* --------------------------- Message storage -------------------------- */
    struct Message {
        address sender;
        address receiver;
        string content;
        uint256 timestamp;
    }

    Message[] private messages;

    event MessageAdded(address indexed sender, address indexed receiver, string content, uint256 timestamp);

    /// @notice 보낸 사람(msg.sender)의 점수가 thresholdBP 이상일 때만 메시지가 기록됨
    function addMessage(address receiver, string calldata content) external {
        require(trustScoreBP[msg.sender]=>= thresholdBP, "trust score below threshold");
        messages.push(Message({
            sender: msg.sender,
            receiver: receiver,
            content: content,
            timestamp: block.timestamp
        }));
        emit MessageAdded(msg.sender, receiver, content, block.timestamp);
    }

    /// @notice 전체 메시지 개수
    function getMessagesLength() external view returns (uint256) {
        return messages.length;
    }

    /// @notice 인덱스로 단건 조회
    function getMessage(uint256 index) external view returns (address sender, address receiver, string memory content, uint256 timestamp) {
        require(index < messages.length, "out of bounds");
        Message storage m = messages[index];
        return (m.sender, m.receiver, m.content, m.timestamp);
    }

    /// @notice 특정 범위를 슬라이스로 조회 (프론트 최적화용)
    function getMessagesRange(uint256 start, uint256 count) external view returns (Message[] memory out) {
        require(start < messages.length || messages.length == 0, "start out of bounds");
        uint256 end = start + count;
        if (end > messages.length) end = messages.length;
        uint256 len = end > start ? (end - start) : 0;

        out = new Message[](len);
        for (uint256 i = 0; i < len; i++) {
            out[i] = messages[start + i];
        }
    }
}
