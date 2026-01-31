import { useState } from "react";
import { House, BookOpen, Compass, Star } from "phosphor-react";
// prayer page is rendered via PrayerPage
import QuranPage from "./QuranPage";
import QiblaPage from "./QiblaPage";
import AsmaPage from "./AsmaPage";
import PrayerPage from "./PrayerPage";

const tabs = [
  { name: "Prayers", icon: House },
  { name: "Quran", icon: BookOpen },
  { name: "Qibla", icon: Compass },
  { name: "Asma", icon: Star },
];

const BottomTabBar = () => {
  const [active, setActive] = useState("Prayers");
  

  const renderContent = () => {
    switch (active) {
      case "Prayers":
        return <PrayerPage />;
      case "Quran":
        return <QuranPage />;
      case "Qibla":
        return <QiblaPage />;
      case "Asma":
        return <AsmaPage />;
      default:
        return <PrayerPage />;
    }
  };

  return (
    <div className="w-[95%] sm:w-[90%] mx-auto flex flex-col h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="flex-1 overflow-y-auto">{renderContent()}</div>

      {/* iOS Style Bottom Bar */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[90%] bg-white/60 backdrop-blur-xl shadow-lg border border-white/30 rounded-3xl py-3">
        <div className="flex justify-around items-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.name;
            return (
              <button
                key={tab.name}
                onClick={() => setActive(tab.name)}
                className={`flex flex-col items-center text-xs transition-all duration-300 ${isActive ? "scale-110" : "scale-100"
                  }`}
              >
                <div
                  className={`p-2 rounded-full ${isActive
                      ? "bg-gradient-to-tr from-purple-500 to-indigo-500 text-white shadow-md"
                      : "text-gray-400"
                    }`}
                >
                  <Icon size={22} />
                </div>
                <span
                  className={`mt-1 ${isActive
                      ? "text-purple-600 font-medium"
                      : "text-gray-400 font-normal"
                    }`}
                >
                  {tab.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomTabBar;
