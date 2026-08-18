"use client";

import { X, TrendingUp } from "lucide-react";

type MembershipLevelModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: string;
  currentSpending: number;
  currentYear: number;
};

const LEVELS = [
  {
    name: "銅級",
    threshold: 0,
    description: "新會員等級",
  },
  {
    name: "銀級",
    threshold: 3000,
    description: "一年內消費滿 NT$3,000",
  },
  {
    name: "金級",
    threshold: 5000,
    description: "一年內消費滿 NT$5,000",
  },
  {
    name: "白金級",
    threshold: 10000,
    description: "一年內消費滿 NT$10,000",
  },
];

export default function MembershipLevelModal({
  isOpen,
  onClose,
  currentLevel,
  currentSpending,
  currentYear,
}: MembershipLevelModalProps) {
  if (!isOpen) return null;

  const currentLevelIndex = LEVELS.findIndex((l) => l.name === currentLevel);
  const nextLevel = currentLevelIndex < LEVELS.length - 1 ? LEVELS[currentLevelIndex + 1] : null;
  const remainingSpending = nextLevel ? Math.max(0, nextLevel.threshold - currentSpending) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-medium text-ink">會員等級詳情</h2>
          <button
            onClick={onClose}
            className="text-taupe-400 transition hover:text-taupe-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 目前等級 */}
        <div className="mb-6 rounded-lg border border-sapphire-200 bg-sapphire-50 p-4">
          <p className="text-xs text-sapphire-600 mb-2">目前等級</p>
          <p className="text-2xl font-bold text-sapphire-600 mb-2">{currentLevel}</p>
          <p className="text-xs text-sapphire-700">{LEVELS[currentLevelIndex]?.description}</p>
        </div>

        {/* 本年消費 */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-taupe-600">
              {currentYear} 年度消費金額
            </span>
            <span className="text-lg font-bold text-ink">NT${currentSpending}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-taupe-100">
            <div
              className="h-full bg-sapphire-600 transition-all"
              style={{
                width: `${Math.min(
                  100,
                  (currentSpending / (nextLevel?.threshold || 10000)) * 100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* 升級進度 */}
        {nextLevel && (
          <div className="mb-6 rounded-lg bg-taupe-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-medium text-taupe-700">升級目標</p>
            </div>
            <p className="text-sm text-taupe-600 mb-2">
              再消費 <span className="font-bold text-emerald-600">NT${remainingSpending}</span> 即可升級至 <span className="font-medium">{nextLevel.name}</span>
            </p>
          </div>
        )}

        {/* 等級列表 */}
        <div className="mb-6 space-y-2">
          <p className="text-xs font-medium text-taupe-600 uppercase">等級列表</p>
          {LEVELS.map((level, idx) => {
            const isCurrentOrPassed = LEVELS.findIndex((l) => l.name === currentLevel) >= idx;
            return (
              <div
                key={level.name}
                className={`flex items-center gap-3 rounded-lg p-3 ${
                  isCurrentOrPassed
                    ? "bg-sapphire-50 border border-sapphire-200"
                    : "bg-taupe-50 border border-taupe-200"
                }`}
              >
                <div
                  className={`h-3 w-3 rounded-full ${
                    isCurrentOrPassed ? "bg-sapphire-600" : "bg-taupe-300"
                  }`}
                />
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      isCurrentOrPassed ? "text-sapphire-700" : "text-taupe-600"
                    }`}
                  >
                    {level.name}
                  </p>
                  <p className="text-xs text-taupe-500">{level.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-lg bg-sapphire-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sapphire-700"
        >
          關閉
        </button>
      </div>
    </div>
  );
}
