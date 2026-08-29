'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqList: FAQItem[] = [
  {
    question: 'Apa itu TheoTownHub?',
    answer: 'TheoTownHub adalah platform informasi & catalog plugin TheoTown non-resmi yang dirancang khusus untuk mempermudah pemain melihat update plugin mingguan, merencanakan wishlist kota, serta mengekspor daftar plugin langsung ke dalam game.',
  },
  {
    question: 'Apakah plugin di sini aman dari virus / malware?',
    answer: 'Semua data plugin tersinkronisasi langsung dari forum resmi TheoTown (BlueFlower Games). Semua file plugin berasal dari server resmi TheoTown sehingga 100% aman untuk dimainkan.',
  },
  {
    question: 'Bagaimana cara memasukkan Wishlist ke dalam game TheoTown?',
    answer: 'Di menu Wishlist Saya, kamu bisa memilih folder atau plugin pilihanmu, lalu klik tombol "Salin Nama Plugin". Buka game TheoTown → Store/Plugin Menu → Tempel (Paste) nama plugin di kolom pencarian.',
  },
  {
    question: 'Apakah TheoTownHub bisa di-install sebagai aplikasi HP/PC (PWA)?',
    answer: 'Bisa! Klik tombol "Install App" di bagian atas halaman ini atau gunakan menu browser (Add to Home Screen / Install App) untuk menjadikannya aplikasi mandiri tanpa perlu mendownload di Play Store.',
  },
  {
    question: 'Apakah akun dan data wishlist saya aman?',
    answer: 'Sangat aman. Sistem login menggunakan standar keamanan OAuth modern langsung dari Google tanpa menyimpan kata sandi email kamu. Data koleksi kota dan wishlist kamu terenkripsi secara privat dan hanya dapat diakses oleh akun kamu sendiri.',
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 px-6 sm:px-12 bg-[#0b0d12] border-t border-white/[0.06]">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-3" data-aos="fade-up">
          <span className="text-xs font-bold tracking-widest text-red-500 uppercase flex items-center justify-center gap-1.5">
            <HelpCircle className="w-4 h-4" /> FAQ & Bantuan
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
            Segala hal yang perlu kamu ketahui tentang fitur, keamanan, dan cara penggunaan TheoTownHub.
          </p>
        </div>

        <div className="space-y-4">
          {faqList.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                data-aos="fade-up"
                data-aos-delay={idx * 50}
                className="bg-[#13161e] border border-white/[0.07] rounded-2xl overflow-hidden transition-all duration-200 hover:border-white/20"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left gap-4"
                >
                  <span className="font-display font-semibold text-sm sm:text-base text-white">
                    {item.question}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-red-600/20 text-red-400' : ''
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-gray-400 leading-relaxed border-t border-white/[0.04]">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
