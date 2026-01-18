import ActionConsole from "../components/ActionConsole";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col items-center justify-start py-10 space-y-10">
      <header className="text-center">
        <h1 className="text-5xl font-extrabold text-yellow-400 mb-2 animate-pulse">
          ⚡ Voltara Node Army
        </h1>
        <p className="text-gray-300 text-lg">
          Your sci-fi node command bridge — live on Ethereum Mainnet
        </p>
      </header>

      <main className="w-full max-w-5xl px-4">
        <ActionConsole />
      </main>

      <footer className="text-gray-500 text-sm mt-10">
        Powered by Voltara • ETH Mainnet • All transactions in ETH
      </footer>
    </div>
  );
}
// pages/index.tsx
import ActionConsole from "../components/ActionConsole";


export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col items-center justify-start py-10 space-y-10">
      <header className="text-center">
        <h1 className="text-5xl font-extrabold text-yellow-400 mb-2 animate-pulse">
          ⚡ Voltara Node Army
        </h1>
        <p className="text-gray-300 text-lg">
          Your sci-fi node command bridge — live on Ethereum Mainnet
        </p>
      </header>

      <main className="w-full max-w-5xl px-4">
        <ActionConsole />
      </main>

      <footer className="text-gray-500 text-sm mt-10">
        Powered by Voltara • ETH Mainnet • All transactions in ETH
      </footer>
    </div>
  );
}
