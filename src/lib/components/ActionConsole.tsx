// components/ActionConsole.tsx
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getBrowserProvider } from "../src/lib/provider";
import { getContract } from "../src/lib/contract";
import { useAnimatedNumber } from "../src/hooks/useAnimatedNumber";
import FloatingMerit from "./FloatingMerit";

const TierNames = ["NONE", "SCOUT", "OPERATOR", "OVERSEER"];

export default function ActionConsole() {
  const [address, setAddress] = useState<string>();
  const [merit, setMerit] = useState<number>(0);
  const [bonus, setBonus] = useState<number>(0);
  const [fee, setFee] = useState<string>("0");
  const [upgradeFee, setUpgradeFee] = useState<string>("0");
  const [tier, setTier] = useState<number>(0);
  const [boosts, setBoosts] = useState<{ [key: number]: number }>({});
  const [txStatus, setTxStatus] = useState<string>("idle");

  // Floating merit animations
  const [floatingMerits, setFloatingMerits] = useState<number[]>([]);

  // Animated numbers
  const animatedMerit = useAnimatedNumber(merit, 600);
  const animatedBonus = useAnimatedNumber(bonus, 600);
  const animatedTier = useAnimatedNumber(tier, 500);

  // Load initial node state
  useEffect(() => {
    loadState();
  }, []);

  // Live on-chain events via Alchemy WebSocket
  useEffect(() => {
    if (!address) return;

    const wsProvider = new ethers.WebSocketProvider(
      "wss://eth-mainnet.g.alchemy.com/v2/aBFiwuvho3cHOSwQ-dDy8"
    );

    const liveContract = getContract(wsProvider);

    const meritHandler = (node: string, newMerit: bigint) => {
      if (node.toLowerCase() === address.toLowerCase()) setMerit(Number(newMerit));
    };

    const boostHandler = (node: string, boostId: number, newLevel: number) => {
      if (node.toLowerCase() === address.toLowerCase()) {
        setBoosts((prev) => ({ ...prev, [boostId]: newLevel }));
        refreshBonus(liveContract, address);
      }
    };

    const tierHandler = (node: string, newTier: number) => {
      if (node.toLowerCase() === address.toLowerCase()) setTier(newTier);
    };

    liveContract.on("MeritAdjusted", meritHandler);
    liveContract.on("BoostPurchased", boostHandler);
    liveContract.on("NodeUpgraded", tierHandler);

    return () => {
      liveContract.off("MeritAdjusted", meritHandler);
      liveContract.off("BoostPurchased", boostHandler);
      liveContract.off("NodeUpgraded", tierHandler);
      wsProvider.destroy();
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
      setTier(Number(node.tier));

      const feeWei = await contract.actionFee();
      setFee(ethers.formatEther(feeWei));

      const upgradeWei = await contract.upgradeFee();
      setUpgradeFee(ethers.formatEther(upgradeWei));

      const bonusBps = await contract.getBoostBonusBps(addr);
      setBonus(Number(bonusBps) / 100);

      const boostLevels: { [key: number]: number } = {};
      for (let i = 1; i <= 5; i++) {
        boostLevels[i] = Number(await contract.boosts(addr, i));
      }
      setBoosts(boostLevels);
    } catch (err) {
      console.error("Error loading state:", err);
      setTxStatus("error");
    }
  }

  async function refreshBonus(contract: any, addr: string) {
    const bonusBps = await contract.getBoostBonusBps(addr);
    setBonus(Number(bonusBps) / 100);
  }

  async function executeAction(baseMerit: number) {
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

      // Trigger floating merit animation
      setFloatingMerits((prev) => [...prev, baseMerit]);
    } catch (err) {
      console.error("Action failed:", err);
      setTxStatus("failed");
    }
  }

  async function buyBoost(boostId: number) {
    try {
      setTxStatus("submitting");
      const provider = getBrowserProvider();
      const signer = await provider.getSigner();
      const contract = getContract(signer);
      const feeWei = await contract.boostFee();
      const tx = await contract.buyBoost(boostId, { value: feeWei });
      setTxStatus("pending");
      await tx.wait();
      setTxStatus("confirmed");
    } catch (err) {
      console.error("Boost purchase failed:", err);
      setTxStatus("failed");
    }
  }

  async function upgradeTier() {
    try {
      setTxStatus("submitting");
      const provider = getBrowserProvider();
      const signer = await provider.getSigner();
      const contract = getContract(signer);
      const upgradeWei = await contract.upgradeFee();
      const tx = await contract.upgradeTier({ value: upgradeWei });
      setTxStatus("pending");
      await tx.wait();
      setTxStatus("confirmed");
    } catch (err) {
      console.error("Tier upgrade failed:", err);
      setTxStatus("failed");
    }
  }

  return (
    <div className="p-6 bg-gray-900 text-white rounded-2xl shadow-lg max-w-5xl mx-auto space-y-6 font-sans">
      <h2 className="text-3xl font-bold text-yellow-400 mb-4 animate-pulse">⚡ Node Command Bridge</h2>

      {/* Merit Counter */}
      <div className="relative p-4 bg-gray-800 rounded-lg shadow-inner text-center animate-pulse">
        <p className="text-sm text-gray-300">Merit</p>
        <p className="text-2xl font-bold text-green-400">{animatedMerit}</p>

        {floatingMerits.map((val, idx) => (
          <FloatingMerit
            key={idx}
            value={val}
            onComplete={() => setFloatingMerits((prev) => prev.filter((_, i) => i !== idx))}
          />
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
        <div className="p-4 bg-gray-800 rounded-lg shadow-inner text-center">
          <p className="text-sm text-gray-300">Boost Bonus</p>
          <p className="text-xl font-bold text-purple-400">+{animatedBonus}%</p>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg shadow-inner text-center">
          <p className="text-sm text-gray-300">Current Tier</p>
          <p className="text-xl font-bold text-blue-400">{TierNames[animatedTier]}</p>
        </div>
        {tier < 3 && (
          <div className="p-4 bg-gray-800 rounded-lg shadow-inner text-center">
            <p className="text-sm text-gray-300">Upgrade Fee</p>
            <p className="text-xl font-bold text-yellow-400">{upgradeFee} ETH</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-yellow-300">🟢 Actions</h3>
        <div className="flex gap-4 flex-wrap">
          {[10, 25, 50].map((v) => (
            <button
              key={v}
              onClick={() => executeAction(v)}
              disabled={txStatus !== "idle"}
              className="bg-green-500 hover:bg-green-600 text-black font-bold py-2 px-4 rounded-lg shadow-md transition-all duration-150 transform hover:-translate-y-1 active:scale-95"
            >
              +{v} Merit
            </button>
          ))}
        </div>
      </div>

      {/* Boost Console */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-purple-300">💠 Boost Bay</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((id) => (
            <div
              key={id}
              className={`p-3 rounded-lg shadow-md text-center transition-transform duration-150 transform hover:scale-105 ${
                (boosts[id] || 0) >= 5 ? "bg-gray-700" : "bg-purple-600"
              }`}
            >
              <p className="font-semibold text-white">Boost {id}</p>
              <p className="text-yellow-400 font-bold">{boosts[id] || 0}/5</p>
              <button
                onClick={() => buyBoost(id)}
                disabled={(boosts[id] || 0) >= 5 || txStatus !== "idle"}
                className="mt-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-1 px-2 rounded-md"
              >
                Buy
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tier Upgrade */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-blue-300">🏅 Tier Upgrade</h3>
        {tier < 3 ? (
          <button
            onClick={upgradeTier}
            disabled={txStatus !== "idle"}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all duration-150 transform hover:-translate-y-1 active:scale-95"
          >
            Upgrade to {TierNames[tier + 1]} ({upgradeFee} ETH)
          </button>
        ) : (
          <p className="text-gray-400 font-bold">Max Tier Reached</p>
        )}
      </div>

      <p className="text-sm text-gray-300 mt-4">
        Status: <span className="font-semibold">{txStatus}</span>
      </p>
    </div>
  );
}
