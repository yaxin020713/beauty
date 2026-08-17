"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ShieldCheck, Banknote, Mail, MessageCircle, Clock } from "lucide-react";
import {
  FREE_SHIPPING_THRESHOLD,
  DISCOUNT_THRESHOLD,
  DISCOUNT_AMOUNT,
  SHIPPING_COSTS,
} from "@/lib/shipping";

const LINE_OA_URL = "https://line.me/ti/p/pYYPGYQMAm";
const SUPPORT_EMAIL = "yaxinzhu2002@gmail.com";

type ModalKey = "guide" | "refund" | null;

export default function Footer() {
  const [openModal, setOpenModal] = useState<ModalKey>(null);

  return (
    <>
      <footer className="bg-ink text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* 第一欄：品牌簡介 */}
            <div>
              <p className="font-serif text-lg font-semibold uppercase tracking-[0.15em] text-white">
                Vesper&apos;s Vanity
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                精緻保養與專櫃彩妝選品 ｜ 100% 官方正貨保證
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-champagne-300/30 px-3 py-1 text-xs text-champagne-200">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  正品保障
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-champagne-300/30 px-3 py-1 text-xs text-champagne-200">
                  <Banknote className="h-3.5 w-3.5" />
                  轉帳安心購
                </span>
              </div>
            </div>

            {/* 第二欄：購物須知 */}
            <div>
              <h3 className="font-serif text-sm font-semibold uppercase tracking-[0.1em] text-champagne-200">
                購物須知
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                <li>
                  <button
                    type="button"
                    onClick={() => setOpenModal("guide")}
                    className="text-left underline-offset-4 transition hover:text-champagne-200 hover:underline"
                  >
                    付款與運費說明
                  </button>
                </li>
              </ul>
            </div>

            {/* 第三欄：退換貨政策 */}
            <div>
              <h3 className="font-serif text-sm font-semibold uppercase tracking-[0.1em] text-champagne-200">
                退換貨政策
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                <li>
                  <button
                    type="button"
                    onClick={() => setOpenModal("refund")}
                    className="text-left underline-offset-4 transition hover:text-champagne-200 hover:underline"
                  >
                    退貨條件與申請方式
                  </button>
                </li>
              </ul>
            </div>

            {/* 第四欄：聯絡我們 */}
            <div>
              <h3 className="font-serif text-sm font-semibold uppercase tracking-[0.1em] text-champagne-200">
                聯絡我們
              </h3>
              <div className="mt-4 space-y-3">
                <a
                  href={LINE_OA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/20"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  LINE 官方帳號
                </a>
                <p className="flex items-center gap-2 text-sm text-white/70">
                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="transition hover:text-champagne-200">
                    {SUPPORT_EMAIL}
                  </a>
                </p>
                <p className="text-xs text-white/45">
                  退貨與商品瑕疵問題請寄信至此
                </p>
                <p className="flex items-center gap-2 text-xs text-white/45">
                  <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                  服務時間：週一至週五 10:00 - 18:00
                </p>
              </div>
            </div>
          </div>

          {/* 底欄 */}
          <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/40 sm:mt-14">
            © {new Date().getFullYear()} Vesper&apos;s Vanity. All Rights Reserved.
          </div>
        </div>
      </footer>

      {/* 購物須知 Modal */}
      <InfoModal
        open={openModal === "guide"}
        onClose={() => setOpenModal(null)}
        title="購物須知"
      >
        <div>
          <p className="font-medium text-ink">付款說明</p>
          <p className="mt-1">
            本站僅提供「銀行轉帳」付款方式，訂單確認並完成轉帳後，我們將為您安排訂貨與出貨。
          </p>
        </div>
        <div>
          <p className="font-medium text-ink">運費與免運</p>
          <p className="mt-1">
            單筆消費滿 NT${FREE_SHIPPING_THRESHOLD.toLocaleString()} 即享全館免運費；未滿
            NT${FREE_SHIPPING_THRESHOLD.toLocaleString()} 運費（含包材費）NT${SHIPPING_COSTS.CONVENIENCE_711}。
          </p>
          <p className="mt-1">
            單筆消費滿 NT${DISCOUNT_THRESHOLD.toLocaleString()} 享免運＋現折 NT${DISCOUNT_AMOUNT}。
          </p>
        </div>
      </InfoModal>

      {/* 退換貨政策 Modal */}
      <InfoModal
        open={openModal === "refund"}
        onClose={() => setOpenModal(null)}
        title="退換貨政策"
      >
        <div>
          <p className="font-medium text-ink">退貨條件</p>
          <p className="mt-1">
            因美妝個人衛生用品屬性，恕不接受個人喜好或心意改變之退換貨，僅接受「商品有瑕疵」或「送錯品項」之退貨申請。
          </p>
        </div>
        <div>
          <p className="font-medium text-ink">申請方式</p>
          <p className="mt-1">
            請於收到商品 7 天內，附上開箱影片與照片，寄信至客服 Email（
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sapphire-600 underline">
              {SUPPORT_EMAIL}
            </a>
            ）聯繫退款事宜。
          </p>
        </div>
      </InfoModal>
    </>
  );
}

function InfoModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="footer-modal-title"
            className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="關閉視窗"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-taupe-400 transition hover:bg-taupe-100 hover:text-taupe-700"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 id="footer-modal-title" className="font-serif text-2xl font-normal text-ink">
              {title}
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-taupe-600">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
