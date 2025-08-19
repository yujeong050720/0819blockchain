PS C:\Users\ido31\OneDrive\Desktop\0818bc> npx hardhat run scripts/testMessages.js --network localhost
Messages length: 1
Message[0]: Result(4) [
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  '안녕하세요, 로컬 테스트 메시지입니다!',
  1755562848n
]
PS C:\Users\ido31\OneDrive\Desktop\0818bc> npx hardhat run scripts/testMessages.js --network localhost
ProviderError: Error: VM Exception while processing transaction: reverted with reason string 'trust score below threshold'
    at HttpProvider.request (C:\Users\ido31\OneDrive\Desktop\0818bc\node_modules\hardhat\src\internal\core\providers\http.ts:116:21)
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at HardhatEthersSigner.sendTransaction (C:\Users\ido31\OneDrive\Desktop\0818bc\node_modules\@nomicfoundation\hardhat-ethers\src\signers.ts:181:18)
    at send (C:\Users\ido31\OneDrive\Desktop\0818bc\node_modules\ethers\src.ts\contract\contract.ts:313:20)
    at Proxy.addMessage (C:\Users\ido31\OneDrive\Desktop\0818bc\node_modules\ethers\src.ts\contract\contract.ts:352:16)
    at main (C:\Users\ido31\OneDrive\Desktop\0818bc\scripts\testMessages.js:14:3)
PS C:\Users\ido31\OneDrive\Desktop\0818bc>
