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



PS C:\Users\ido31\OneDrive\Desktop\0818bc> npx hardhat run scripts/deploy.js --network localhost
Deploying TrustedChat contract...
✅ TrustedChat deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
Deployer address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Deployer balance: 9999994981010721617746
PS C:\Users\ido31\OneDrive\Desktop\0818bc>




Accounts
========

WARNING: These accounts, and their private keys, are publicly known.
Any funds sent to them on Mainnet or any other live network WILL BE LOST.

Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (10000 ETH)
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a

Account #3: 0x90F79bf6EB2c4f870365E785982E1f101E93b906 (10000 ETH)
Private Key: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6

Account #4: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 (10000 ETH)
Private Key: 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a

Account #5: 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc (10000 ETH)
Private Key: 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba

Account #6: 0x976EA74026E726554dB657fA54763abd0C3a0aa9 (10000 ETH)
Private Key: 0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e

Account #7: 0x14dC79964da2C08b23698B3D3cc7Ca32193d9955 (10000 ETH)
Private Key: 0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356

Account #8: 0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f (10000 ETH)
Private Key: 0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97

Account #9: 0xa0Ee7A142d267C1f36714E4a8F75612F20a79720 (10000 ETH)
Private Key: 0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6

Account #10: 0xBcd4042DE499D14e55001CcbB24a551F3b954096 (10000 ETH)
Private Key: 0xf214f2b2cd398c806f84e317254e0f0b801d0643303237d97a22a48e01628897

Account #11: 0x71bE63f3384f5fb98995898A86B02Fb2426c5788 (10000 ETH)
Private Key: 0x701b615bbdfb9de65240bc28bd21bbc0d996645a3dd57e7b12bc2bdf6f192c82

Account #12: 0xFABB0ac9d68B0B445fB7357272Ff202C5651694a (10000 ETH)
Private Key: 0xa267530f49f8280200edf313ee7af6b827f2a8bce2897751d06a843f644967b1

Account #13: 0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec (10000 ETH)
Private Key: 0x47c99abed3324a2707c28affff1267e45918ec8c3f20b8aa892e8b065d2942dd

Account #14: 0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097 (10000 ETH)
Private Key: 0xc526ee95bf44d8fc405a158bb884d9d1238d99f0612e9f33d006bb0789009aaa

Account #15: 0xcd3B766CCDd6AE721141F452C550Ca635964ce71 (10000 ETH)
Private Key: 0x8166f546bab6da521a8369cab06c5d2b9e46670292d85c875ee9ec20e84ffb61

Account #16: 0x2546BcD3c84621e976D8185a91A922aE77ECEc30 (10000 ETH)
Private Key: 0xea6c44ac03bff858b476bba40716402b03e41b8e97e276d1baec7c37d42484a0

Account #17: 0xbDA5747bFD65F08deb54cb465eB87D40e51B197E (10000 ETH)
Private Key: 0x689af8efa8c651a91ad287602527f3af2fe9f6501a7ac4b061667b5a93e037fd

Account #18: 0xdD2FD4581271e230360230F9337D5c0430Bf44C0 (10000 ETH)
Private Key: 0xde9be858da4a475276426320d5e9262ecfc3ba460bfac56360bfa6c4c28b4ee0

Account #19: 0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199 (10000 ETH)
Private Key: 0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e

WARNING: These accounts, and their private keys, are publicly known.
Any funds sent to them on Mainnet or any other live network WILL BE LOST.

eth_accounts
hardhat_metadata (20)
eth_blockNumber
eth_getBlockByNumber
eth_feeHistory
eth_maxPriorityFeePerGas
eth_sendTransaction
  Contract deployment: <UnrecognizedContract>
  Contract address:    0x5fbdb2315678afecb367f032d93f642f64180aa3
  Transaction:         0x07657e475e4ef1254b2a7aa4c9ba1295ada1879392bf9f75703dfc0611df4a99
  From:                0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
  Value:               0 ETH
  Gas used:            1691359 of 30000000
  Block #1:            0xc0dfd4fbe27078977de9514cfb88d4f70dc1648d995dc299094874aceea62341

eth_getTransactionByHash
eth_accounts
hardhat_metadata (20)
eth_blockNumber
eth_getBlockByNumber
eth_feeHistory
eth_sendTransaction
  Contract deployment: <UnrecognizedContract>
  Contract address:    0xe7f1725e7734ce288f8367e1bb143e90bb3f0512
  Transaction:         0x2f99df16ef4d9fcd893e2b53c1ab3e792d627cfbe57d6f7b42964da2b1d0e667
  From:                0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
  Value:               0 ETH
  Gas used:            1691359 of 30000000
  Block #2:            0x07e191f4f0ac7dd3203af144d4b807eecaf71313876b7db3bfaa7b31d65387aa

eth_getTransactionByHash
eth_accounts
hardhat_metadata (20)
eth_accounts
hardhat_metadata (20)
eth_blockNumber
eth_getBlockByNumber
eth_feeHistory
eth_sendTransaction
  Contract deployment: <UnrecognizedContract>
  Contract address:    0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0
  Transaction:         0xe6c2ff99a7441809e97977cf91f514ecd59ae9d006baaac8c6576e0bbef41f73
  From:                0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
  Value:               0 ETH
  Gas used:            1691359 of 30000000
  Block #3:            0x14ce43f53a5cdbb81bd1123eec5923028d994fc16e83306d32fae08dac84a0be

eth_getTransactionByHash
eth_accounts
hardhat_metadata (20)
eth_getBalance
eth_accounts
hardhat_metadata (20)
eth_accounts
hardhat_metadata (20)
eth_accounts
hardhat_metadata (20)
eth_blockNumber
eth_getBlockByNumber
eth_feeHistory
eth_sendTransaction
  Transaction:         0xc3f8ce9e4c524129a0bacb3e5b1a125445a5e511645a998bc59ea0b7b76c9dc0
  From:                0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
  To:                  0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
  Value:               0 ETH
  Gas used:            22460 of 30000000
  Block #4:            0xdce01a8df4deb9c1b2654e6d048affdbaffa4df58321a7b84dab8e84ca9ce062

eth_getTransactionByHash
eth_blockNumber
eth_feeHistory
eth_sendTransaction
  Transaction:         0xff0db2c3c67e53ae607bc2c5568572e96e5484342a07b9c805662abcdeba8a24
  From:                0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
  To:                  0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
  Value:               0 ETH
  Gas used:            25010 of 30000000
  Block #5:            0x7c89d902badb634f11bb5deb58c6f9df76031a6be0046bfb1e6b446ac85a85b3

eth_getTransactionByHash
eth_call
  WARNING: Calling an account which is not a contract
  From:                0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
  To:                  0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266

eth_accounts
hardhat_metadata (20)
eth_accounts
hardhat_metadata (20)
eth_blockNumber
eth_getBlockByNumber
eth_feeHistory
eth_sendTransaction
  Contract call:       <UnrecognizedContract>
  Transaction:         0xcd14de117d386d1421c7e00cc6f84c099f4a0901c935ea17a29b82518261561c
  From:                0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
  To:                  0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0
  Value:               0 ETH
  Gas used:            48268 of 30000000
  Block #6:            0x05174694251ad778b390bab6db05f0cd638bfb004ae5f25ea12f5794ecab3431

eth_getTransactionByHash
eth_blockNumber
eth_feeHistory
eth_sendTransaction
  Contract call:       <UnrecognizedContract>
  Transaction:         0x9cf448f71fc55ac8c1a41b9a6b8d17c0610506fa86161253b03d7d653cf2892d
  From:                0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
  To:                  0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0
  Value:               0 ETH
  Gas used:            187090 of 30000000
  Block #7:            0x25ff9fffdde1e5c1a1a8f38d3f8651d9db79145c3a224de7ab250a2c4a49eaf6

eth_getTransactionByHash
eth_call
  Contract call:       <UnrecognizedContract>
  From:                0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
  To:                  0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0

eth_call
  Contract call:       <UnrecognizedContract>
  From:                0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
  To:                  0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0

eth_accounts
hardhat_metadata (20)
eth_accounts
hardhat_metadata (20)
eth_blockNumber
eth_getBlockByNumber
eth_feeHistory
eth_sendTransaction
  Contract call:       <UnrecognizedContract>
  Transaction:         0x0c450ee08515e188e4161e7433ecb93c582aeeae2aa550a3d3daadb92a8a6e58
  From:                0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
  To:                  0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0
  Value:               0 ETH
  Gas used:            31168 of 30000000
  Block #8:            0x8ef20bde218f230a5ac1e44cf6510737274aaf6bfbf7f4886d7d506c64fe8532

eth_getTransactionByHash
eth_blockNumber
eth_feeHistory
eth_sendTransaction
  Contract call:       <UnrecognizedContract>
  Transaction:         0x8bcb88d450c02c26cc5e5b68b01d80690b464c7c1f85d9e5a2cb24fff23058c0
  From:                0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
  To:                  0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0
  Value:               0 ETH
  Gas used:            27939 of 30000000
  Block #9:            0xa82df9992d19e2e0129e82ebcd540fa39811ecdd9cc64c3c5b7e39ba1633ff04

  Error: reverted with reason string 'trust score below threshold'
