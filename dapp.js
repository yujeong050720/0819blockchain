import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.2/dist/ethers.min.js";

const CONTRACT = "0x057ef64E23666F000b34aE31332854aCBd1c8544"; 

const ABI = [
  "function join() public",
  "function postLink(string url) external returns (bytes32)",
  "function click(bytes32 linkId) public",
  "function report(address subject) external",

  "function members(address) view returns (address addr,bool isOfficial,uint256 certification,uint256 joinTime,uint256 initialYesVotes,uint256 clickCount)",
  "function getPersonalRelationshipScore(address member) view returns (uint256)",
  "function getPairRelationship(address a, address b) view returns (uint256)",

  "event LinkClicked(bytes32 indexed linkId, address indexed clicker, uint256 clicks)"
];

let _provider, _signer, _contract, _me;
async function ensureSetup() {
  if (!_provider) {
    if (!window.ethereum) throw new Error("MetaMask가 설치되어 있지 않습니다.");
    _provider = new ethers.BrowserProvider(window.ethereum);
  }
  if (!_signer) _signer = await _provider.getSigner();
  if (!_contract) _contract = new ethers.Contract(CONTRACT, ABI, _signer);
  if (!_me) _me = (await _signer.getAddress()).toLowerCase();
  return { provider: _provider, signer: _signer, contract: _contract, me: _me };
}

// 메타마스크 지갑 연결 함수
export async function connectWallet() {
  if (!window.ethereum) throw new Error("MetaMask가 설치되어 있지 않습니다.");
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  if (!accounts || accounts.length === 0) throw new Error("지갑 주소를 가져올 수 없습니다.");
  return accounts[0].toLowerCase();
}

export async function getCertification(addr) {
  const { contract } = await ensureSetup();
  const m = await contract.members(addr);
  return Number(m.certification) / 1000;
}

export async function getPersonalRelScore(addr) {
  const { contract } = await ensureSetup();
  const v = await contract.getPersonalRelationshipScore(addr);
  return Number(v) / 1000;
}

export async function getPairRelScore(a, b) {
  const { contract } = await ensureSetup();
  const v = await contract.getPairRelationship(a, b);
  return Number(v) / 1000;
}

export async function sendOnChainClick(url, subjectAddress) {
  const { contract } = await ensureSetup();
  // linkId 매핑 필요: 별도 구현 권장
  throw new Error("sendOnChainClick 함수 내 linkId 매핑 기능 보완 필요");
}

export function listenClickEvents(cb) {
  ensureSetup().then(({ contract }) => {
    contract.on("LinkClicked", (linkId, clicker, clicks) => {
      cb?.({ linkId, clicker, clicks: Number(clicks) });
    });
  });
}
