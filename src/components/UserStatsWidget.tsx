import { FaTrophy, FaComments, FaLightbulb, FaGavel } from "react-icons/fa";

interface Props {
  activityScore: number;
  debatesCreated: number;
  argumentsPosted: number;
  milestonesCompleted: number;
}

export default function UserStatsWidget({
  activityScore,
  debatesCreated,
  argumentsPosted,
  milestonesCompleted,
}: Props) {
  // Example thresholds
  const activityMax = 100;
  const debatesMax = 10;
  const argumentsMax = 20;
  const milestonesMax = 5;

  return (
    <aside className="hidden lg:block fixed top-36 right-10 w-80 z-30">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl p-6 flex flex-col gap-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <FaTrophy className="text-yellow-400" /> Your Stats
        </h3>
        <StatBar
          icon={<FaTrophy className="text-yellow-400" />}
          label="Activity Score"
          value={activityScore}
          max={activityMax}
        />
        <StatBar
          icon={<FaComments className="text-blue-400" />}
          label="Debates Created"
          value={debatesCreated}
          max={debatesMax}
        />
        <StatBar
          icon={<FaGavel className="text-green-400" />}
          label="Arguments Posted"
          value={argumentsPosted}
          max={argumentsMax}
        />
        <StatBar
          icon={<FaLightbulb className="text-pink-400" />}
          label="Milestones"
          value={milestonesCompleted}
          max={milestonesMax}
        />
        {/* Footer/app info section */}
        <div className="mt-6 border-t border-gray-700 pt-4 text-xs text-gray-400 flex flex-col gap-2">
          <div className="text-center">© 2025 society+</div>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="https://sp-info.pages.dev/about" target="_blank" rel="noopener noreferrer" className="hover:underline">About</a>
            <a href="https://sp-info.pages.dev/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline">Privacy</a>
            <a href="https://sp-info.pages.dev/contact" target="_blank" rel="noopener noreferrer" className="hover:underline">Feedback</a>
            <a href="https://sp-info.pages.dev/blog" target="_blank" rel="noopener noreferrer" className="hover:underline">Blog</a>
          </div>
        </div>
      </div>
    </aside>
  );
}

function StatBar({
  icon,
  label,
  value,
  max,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  max: number;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  // Simple level logic for demo
  let level = "";
  let nextBadge = "";
  if (label === "Arguments Posted") {
    if (value < 10) level = "Novice Debater";
    else if (value < 20) level = "Bronze Debater";
    else level = "Silver Debater";
    nextBadge = `Post ${max} arguments to unlock next badge.`;
  } else if (label === "Debates Created") {
    if (value < 5) level = "Starter";
    else if (value < 10) level = "Initiator";
    else level = "Debate Leader";
    nextBadge = `Create ${max} debates to unlock next badge.`;
  } else if (label === "Activity Score") {
    if (value < 50) level = "Active";
    else if (value < 100) level = "Engaged";
    else level = "Champion";
    nextBadge = `Reach ${max} activity to unlock next badge.`;
  } else if (label === "Milestones") {
    if (value < 2) level = "Getting Started";
    else if (value < 5) level = "Milestone Maker";
    else level = "Goal Crusher";
    nextBadge = `Complete ${max} milestones to unlock next badge.`;
  }

  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-white font-medium">{label}</span>
        <span className="ml-auto text-gray-300">{value}/{max}</span>
      </div>
      <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden relative" title={nextBadge}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg,#fbbf24,#3b82f6,#10b981,#ec4899)",
          }}
        />
        {/* Tooltip on hover */}
        <span className="absolute left-1/2 -translate-x-1/2 bottom-6 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg z-10 whitespace-nowrap pointer-events-none">
          {nextBadge}
        </span>
      </div>
      {/* Level label below bar */}
      <div className="text-xs text-gray-400 mt-1 text-center">{value}/{max} → {level}</div>
    </div>
  );
}
