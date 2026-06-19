import React from 'react';
import { useBEPStore } from '../../store/bepStore';
import { Plus, FileText, Layers, Ruler, Server, Calendar, Users, ListChecks, Paperclip, BookOpen, ArrowRight, LayoutDashboard, Settings, Home as HomeIcon, Box } from 'lucide-react';
import { motion } from 'motion/react';
import clsx from 'clsx';

export function Sidebar() {
  const { blocks, addBlock, activeView, setActiveView } = useBEPStore();

  const modules = [
    { type: 'general_project', label: '1. Info. Gerais do Projeto', icon: FileText },
    { type: 'general_team', label: '2. Equipe do Projeto', icon: Users },
    { type: 'responsibility_matrix', label: '3. Matriz de Responsabilidades', icon: ListChecks },
    { type: 'deliverables_matrix', label: '4. Matriz de Entregáveis', icon: Layers },
    { type: 'bim_uses_goals', label: '5. Usos BIM (Objetivos)', icon: Layers },
    { type: 'bim_uses_infra', label: '6. Usos BIM (Infra)', icon: Server },
    { type: 'project_requirements', label: '7. Requisitos (LOIN/LOD)', icon: Ruler },
    { type: 'schedule', label: '8. Marcos do Projeto', icon: Calendar },
    { type: 'roles_responsibilities', label: '9. Papéis e Resp.', icon: Users },
    { type: 'references', label: '10. Referências', icon: BookOpen },
    { type: 'attachments', label: '11. Anexos', icon: Paperclip },
  ];

  const views = [
    { id: 'home', label: 'Início', icon: HomeIcon },
    { id: 'editor', label: 'Editor de BEP', icon: Settings },
    { id: 'kanban', label: 'KANBAN', icon: LayoutDashboard },
    { id: 'ifc', label: 'IFC / Análise', icon: Box },
  ] as const;

  const handleNavigation = (type: string) => {
    setActiveView('editor');
    // Check if block exists
    const block = blocks.find(b => b.type === type);
    if (block) {
      // Scroll to block
      const element = document.getElementById(`block-${block.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // Add block if it doesn't exist (fallback)
      addBlock(type as any);
    }
  };

  return (
    <aside className="w-72 bg-white border-r border-slate-200 p-6 flex flex-col h-full shadow-sm z-10 overflow-y-auto shrink-0">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold">BA</span>
        </div>
        <span className="font-bold text-lg text-slate-800">BEP.ai</span>
      </div>

      <nav aria-label="Modo de visualização" className="space-y-1 mb-8">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">
          Modo de Visualização
        </h3>
        {views.map((view) => {
          const active = activeView === view.id;
          return (
            <motion.button
              key={view.id}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveView(view.id)}
              aria-current={active ? 'page' : undefined}
              className={clsx(
                "w-full flex items-center gap-3 px-3 min-h-[44px] text-sm font-medium rounded-lg transition-colors group text-left",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500",
                active ? "text-orange-700 bg-orange-100" : "text-slate-600 hover:text-orange-700 hover:bg-orange-50"
              )}
            >
              <view.icon className="w-4 h-4 shrink-0" />
              <span>{view.label}</span>
            </motion.button>
          );
        })}
      </nav>

      <nav aria-label="Seções do BEP" className="space-y-1">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">
          Navegação
        </h3>

        {modules.map((module) => (
          <motion.button
            key={module.type}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleNavigation(module.type)}
            className="w-full flex items-center gap-3 px-3 min-h-[44px] text-sm font-medium text-slate-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <module.icon className="w-4 h-4 text-slate-400 group-hover:text-orange-600 shrink-0" />
            <span className="truncate">{module.label}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-auto text-slate-300 group-hover:text-orange-600 shrink-0" />
          </motion.button>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-100">
        <div className="bg-orange-50 rounded-xl p-4">
          <h4 className="text-orange-900 font-semibold text-sm mb-1">Precisa de ajuda?</h4>
          <p className="text-orange-700 text-xs mb-3">
            O assistente IA está ativo para validar seus inputs normativos.
          </p>
        </div>
      </div>
    </aside>
  );
}

