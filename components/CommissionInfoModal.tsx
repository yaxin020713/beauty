"use client";

import { X } from "lucide-react";

type CommissionInfoModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CommissionInfoModal({ isOpen, onClose }: CommissionInfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-medium text-ink">分潤機制說明</h2>
          <button
            onClick={onClose}
            className="text-taupe-400 transition hover:text-taupe-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 text-sm text-taupe-700">
          <section>
            <h3 className="mb-2 font-medium text-ink">如何獲得分潤</h3>
            <p>
              分享您的專屬推薦連結或推薦碼給朋友，朋友透過連結進站、或在結帳時手動輸入您的推薦碼下單，訂單完成後您就能獲得分潤。沒有次數限制，朋友每次下單都算。
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-medium text-ink">分潤何時入帳</h3>
            <p>
              分潤不是下單當下就入帳，而是等訂單狀態轉為「已完成」才會計入您的待提現分潤——訂單出貨滿 8 天會自動轉為已完成，或由管理員手動確認完成。訂單尚未完成前，分潤明細會顯示「訂單完成後入帳」。
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-medium text-ink">推薦連結與推薦碼不一致時</h3>
            <p>
              如果朋友是透過您的推薦連結進站，卻在結帳時手動改填了另一位推薦人的推薦碼，且兩者確實是不同人，該筆訂單的分潤會由兩位推薦人各半，並會在分潤明細中註明。
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-medium text-ink">分潤成果的三個數字</h3>
            <ul className="space-y-2">
              <li className="rounded-lg bg-emerald-50 p-3">
                <span className="font-medium text-emerald-700">待提現分潤：</span>
                目前可提現的餘額，訂單完成時增加、按下提現時扣減。
              </li>
              <li className="rounded-lg bg-sapphire-50 p-3">
                <span className="font-medium text-sapphire-700">撥款處理中：</span>
                您已申請提現、正在等待撥款的金額。
              </li>
              <li className="rounded-lg bg-taupe-50 p-3">
                <span className="font-medium text-ink">歷史累計：</span>
                您從加入以來累積賺取的分潤總額，只增不減，用來記錄總成果。
              </li>
            </ul>
          </section>

          <section>
            <h3 className="mb-2 font-medium text-ink">提現規則</h3>
            <ul className="list-disc space-y-1 pl-4">
              <li>待提現分潤滿 NT$500 才能申請提現</li>
              <li>每次提現會一次領出當下全部的待提現分潤</li>
              <li>每 30 天只能申請一次提現</li>
              <li>銀行帳號非永豐銀行（807）者，每次提現收取 NT$15 手續費</li>
            </ul>
          </section>

          <section>
            <h3 className="mb-2 font-medium text-ink">注意事項</h3>
            <p>
              不可使用自己的推薦連結或推薦碼替自己下單，這類訂單不會產生分潤。
            </p>
          </section>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-sapphire-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sapphire-700"
        >
          我知道了
        </button>
      </div>
    </div>
  );
}
