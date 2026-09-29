"use client";

import { X } from "lucide-react";

type MemberTermsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function MemberTermsModal({ isOpen, onClose }: MemberTermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-medium text-ink">會員資料使用條款</h2>
          <button
            onClick={onClose}
            className="text-taupe-400 transition hover:text-taupe-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 text-sm text-taupe-700">
          <section>
            <h3 className="mb-2 font-medium text-ink">我們蒐集哪些資料</h3>
            <p>
              為了提供會員服務，我們會蒐集您的 Email、生日、預設收件姓名與聯絡電話、預設 7-11 取貨店號，以及您選擇提現時填寫的銀行帳戶資訊。此外也會保留您的訂單紀錄、消費金額，以及推薦碼與分潤紀錄。
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-medium text-ink">資料使用目的</h3>
            <ul className="list-disc space-y-1 pl-4">
              <li>會員身分識別與帳戶管理</li>
              <li>訂單處理、出貨聯繫與客服回覆</li>
              <li>推薦分潤計算與提現作業</li>
              <li>會員等級與消費金額統計</li>
            </ul>
          </section>

          <section>
            <h3 className="mb-2 font-medium text-ink">資料保存方式</h3>
            <p>
              您的資料儲存於本站的內部資料庫，僅供本站營運與客服使用，不會提供第三方作為行銷用途。銀行帳戶資訊僅用於提現撥款作業。
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-medium text-ink">您的權利</h3>
            <p>
              您可隨時於「會員專區」查詢與更正個人資料。如需刪除會員資料，請透過網站公告的客服 Email 與我們聯繫。
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-medium text-ink">條款修改</h3>
            <p>
              本條款如有修改，將於網站公告；您於修改後繼續使用會員服務，視為同意修改後之條款內容。
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
