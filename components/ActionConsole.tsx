import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getBrowserProvider } from "../src/lib/provider";
import { getContract } from "../src/lib/contract";
import { useAnimatedNumber } from "../src/hooks/useAnimatedNumber";

export default function ActionConsole() {
  const [address, setAddress] = useState<string>();
  const [merit, setMerit] = useState<number>(0);
  const [fee, setFee] = useState<string>("0");
  const [bonus, setBonus] = useState<number>(0);
  const [txStatus, setTxStatus] = useState<string>("idle");

  const animatedMerit = useAnimatedNumber(merit);

  useEffect(() => {
    loadState();
  }, []);

  async function loadState() {
    const provider = getBrowserProvider();
    const signer = await provider.getSigner();
    const addr = await signer.getAddress();
    setAddress(addr);

    const contract = getContract(provider);
    const node = await contract.nodes(addr);

    if (!node.active) throw new Error("Not a node");

    setMerit(Number(node.merit));

    const feeWei = await contract.actionFee();
    setFee(ethers.formatEther(feeWei));

    const bonusBps = await contract.getBoostBonusBps(addr);
    setBonus(Number(bonusBps) / 100);
  }

  async function executeAction(baseMerit: number) {
    setTxStatus("submitting");

    const provider = getBrowserProvider();
    const signer = await provider.getSigner();
    const contract = getContract(signer);

    const feeWei = await contract.actionFee();

    const tx = await contract.nodeAction(baseMerit, {
      value: feeWei
    });

    setTxStatus("pending");
    await tx.wait();
    setTxStatus("confirmed");
  }

  return (
    <div className="console">
      <h2>⚡ Action Console</h2>

      <div className="p-4 bg-gray-800 rounded-lg shadow-inner text-center animate-pulse">
        <p className="text-sm text-gray-300">Merit</p>
        <p className="text-2xl font-bold text-green-400">{animatedMerit}</p>
      </div>

      <p>Boost Bonus: +{bonus}%</p>
      <p>Action Fee: {fee} ETH</p>

      <div className="actions">
        {[10, 25, 50].map(v => (
          <button key={v} onClick={() => executeAction(v)}>
            Execute +{v} Merit
          </button>
        ))}
      </div>

      <p>Status: {txStatus}</p>
    </div>
  );
}
