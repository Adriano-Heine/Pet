import React from 'react';
import { MessageCircle } from 'lucide-react';

export const DeveloperBanner: React.FC = () => {
  const whatsappUrl = 'https://wa.me/5571991261474?text=Ol%C3%A1%20Adriano,%20vim%20pelo%20app%20PetCare!';

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-slate-900 dark:bg-slate-950 text-slate-300 hover:text-emerald-400 hover:bg-slate-800/90 transition-colors py-1.5 px-4 overflow-hidden border-b border-slate-800/80 group"
      title="Falar com Adriano no WhatsApp"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center overflow-hidden">
        <MessageCircle className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
        <div className="whitespace-nowrap overflow-hidden">
          <span className="inline-block animate-marquee sm:animate-none font-medium text-[11px] sm:text-xs">
            Desenvolvido por <strong className="text-emerald-400 group-hover:text-emerald-300 underline underline-offset-2 decoration-emerald-500/40">Adriano</strong> • Fale comigo no WhatsApp
          </span>
        </div>
      </div>
    </a>
  );
};


