import { useState, useEffect } from "react";
import { ethers } from "ethers";
import FloatingMerit from "./FloatingMerit";
import TxStatus from "./TxStatus";
import { useAnimatedNumber } from "../src/hooks/useAnimatedNumber";
import { getBrowserProvider } from "../src/lib/provider";
import { getContract } from "../src/lib/contract";

export default function ActionConsole() {
  const [address, setAddress] = useState<string>();
  const [merit, setMerit] = useState<number>(0);
  const [fee, setFee] = useState<string>("0");
  const [bonus, setBonus] = useState<number>(0);
  const [txStatus, setTxStatus] = useState<string>("idle");

  const animatedMerit = useAnimatedNumber(merit);

  useEffect(() => {
    loadState();

    const wsProvider = new ethers.WebSocketProvider(
      "wss://eth-mainnet.g.alchemy.com/v2/aBFiwuvho3cHOSwQ-dDy8"
    );
    const liveContract = getContract(wsProvider);

    if (address) {
      liveContract.on("MeritAdjusted", (node, newMerit) => {
        if (node.toLowerCase() === address.toLowerCase()) {
          setMerit(Number(newMerit));
        }
      });
    }

    return () => {
      wsProvider.destroy();
      liveContract.removeAllListeners("MeritAdjusted");
    };
  }, [address]);

  async function loadState() {
    try {
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
    } catch (err: any) {
      console.error("Failed to load node state:", err.message);
      setTxStatus("error");
    }
  }

  async function executeAction(baseMerit: number) {
    if (!address) return;

    try {
      setTxStatus("submitting");

      const provider = getBrowserProvider();
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      const feeWei = await contract.actionFee();

      const tx = await contract.nodeAction(baseMerit, { value: feeWei });

      setTxStatus("pending");
      await tx.wait();
      setTxStatus("confirmed");

      loadState();
    } catch (err: any) {
      console.error("Action failed:", err.message);
      setTxStatus("error");
    }
  }

  return (
    <div className="console p-6 bg-gray-900 text-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">⚡ Node Army Action Console</h2>

      <FloatingMerit merit={animatedMerit} />

      <p className="mt-2">Boost Bonus: +{bonus}%</p>
      <p>Action Fee: {fee} ETH</p>

      <div className="actions flex gap-2 mt-4">
        {[10, 25, 50].map((v) => (
          <button
            key={v}
            className="bg-green-600 px-4 py-2 rounded hover:bg-green-500 transition"
            onClick={() => executeAction(v)}
          >
            Execute +{v} Merit
          </button>
        ))}
      </div>

      <TxStatus status={txStatus} />
    </div>
  );
}
