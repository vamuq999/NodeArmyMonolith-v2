// src/lib/contract.ts
import { ethers } from "ethers";

export const CONTRACT_ADDRESS =
  "0xbcf997d0b8E6582b56A70efeA963ADE408490602";

export const ABI = [
  "function nodes(address) view returns (bool active, uint8 tier, uint256 merit, uint256 joinedAt)",
  "function actionFee() view returns (uint256)",
  "function getBoostBonusBps(address) view returns (uint256)",
  "function nodeAction(uint256 baseMerit) payable",
  "event NodeAction(address indexed node, uint256 baseMerit, uint256 finalMerit, uint256 feePaid)",
  "event MeritAdjusted(address indexed node, uint256 newMerit)"
];

export function getContract(signerOrProvider: any) {
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, signerOrProvider);
}
