const hre = require("hardhat");

async function main() {
  const contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // deploy.js에서 나온 주소
  const TrustedChat = await hre.ethers.getContractFactory("TrustedChat");
  const chat = await TrustedChat.attach(contractAddress);

  const [deployer, user1] = await hre.ethers.getSigners();

  // 신뢰 점수 설정 (서버에서 하는 것처럼)
  await chat.setTrustScore(deployer.address, 3000); // thresholdBP=5000 이상이면 메시지 기록 가능

  // 메시지 보내기
  await chat.addMessage(user1.address, "안녕하세요, 로컬 테스트 메시지입니다!");

  // 메시지 길이 확인
  const len = await chat.getMessagesLength();
  console.log("Messages length:", len.toString());

  // 메시지 내용 확인
  const message = await chat.getMessage(0);
  console.log("Message[0]:", message);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
