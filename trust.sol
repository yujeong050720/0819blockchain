// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LinkClickLogger4Byte {
    struct ClickRecord {
        address fromUser;    // 20 bytes
        address toUser;      // 20 bytes
        bytes4 linkHash;     // 4 bytes 해시값
        uint256 timestamp;   // 32 bytes
    }

    ClickRecord[] public clickRecords;

    event LinkClicked(
        address indexed fromUser,
        address indexed toUser,
        bytes4 indexed linkHash,
        uint256 timestamp
    );

    function recordClick(address toUser, string calldata link) public {
        // 4바이트 해시 계산 (keccak256 해시를 4바이트로 자름)
        bytes32 fullHash = keccak256(bytes(link));
        bytes4 shortHash = bytes4(fullHash);

        ClickRecord memory rec = ClickRecord({
            fromUser: msg.sender,
            toUser: toUser,
            linkHash: shortHash,
            timestamp: block.timestamp
        });

        clickRecords.push(rec);
        emit LinkClicked(msg.sender, toUser, shortHash, block.timestamp);
    }

    function getClickCount() public view returns (uint) {
        return clickRecords.length;
    }

    function getClickRecord(uint index) public view returns (
        address fromUser,
        address toUser,
        bytes4 linkHash,
        uint256 timestamp
    ) {
        require(index < clickRecords.length, "Out of range");
        ClickRecord storage rec = clickRecords[index];
        return (rec.fromUser, rec.toUser, rec.linkHash, rec.timestamp);
    }
}
