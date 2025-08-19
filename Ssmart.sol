// smart.js
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// 1. RPC Provider (예: Hardhat, Ganache, Infura, Alchemy 등)
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545"); // 로컬 노드 RPC

// 2. 운영자 지갑 (private key 필요)
const privateKey = "0xYOUR_PRIVATE_KEY"; // 실제 운영자 프라이빗 키
const wallet = new ethers.Wallet(privateKey, provider);

// 3. ABI & Contract Address
const abiPath = path.join(__dirname, "RelationMessage.json"); // 컴파일된 ABI JSON
const abi = JSON.parse(fs.readFileSync(abiPath, "utf8")).abi;
const contractAddress = "0xYOUR_DEPLOYED_CONTRACT_ADDRESS";

// 4. Contract 객체
const contract = new ethers.Contract(contractAddress, abi, wallet);

// ----------------------------- //
// 서버에서 호출할 함수들
// ----------------------------- //

// 개인 점수 세팅
async function setRelationScore(user, score) {
  const tx = await contract.setRelationScore(user, score);
  await tx.wait();
  console.log(`✅ 점수 기록: ${user} = ${score}`);
}

// 메시지 전송
async function recordOnChainMessage(content) {
  const tx = await contract.sendMessage(content);
  await tx.wait();
  console.log(`✅ 메시지 기록: ${content}`);
}

// 메시지 클릭
async function recordOnChainClick(messageId, clicker) {
  const tx = await contract.clickMessage(messageId);
  await tx.wait();
  console.log(`✅ 메시지 클릭 기록: messageId=${messageId}, clicker=${clicker}`);
}

// 메시지 조회
async function fetchMessages() {
  const msgs = await contract.getMessages();
  return msgs.map(m => ({
    id: m.id.toString(),
    sender: m.sender,
    content: m.content
  }));
}

module.exports = {
  setRelationScore,
  recordOnChainMessage,
  recordOnChainClick,
  fetchMessages
};
