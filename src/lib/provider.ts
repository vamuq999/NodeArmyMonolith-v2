// src/lib/provider.ts
import { ethers } from "ethers";

export function getBrowserProvider() {
  if (!window.ethereum) throw new Error("No wallet");
  return new ethers.BrowserProvider(window.ethereum);
}
