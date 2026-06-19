import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BlockData, useBEPStore } from '../../store/bepStore';
import { GripVertical, ChevronDown, ChevronRight, X, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import clsx from 'clsx';
import { isGeneratable, generateSection } from '../../lib/bep/sections';

interface BlockWrapperProps {
  block: BlockData;
  children: React.ReactNode;
}

export function BlockWrapper({ block, children }: BlockWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id });

  const { toggleBlock, removeBlock, updateBlockContent, isoContext } = useBEPStore();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!isoContext) {
      alert('Importe um documento (PDF) primeiro para gerar esta seção com IA.');
      return;
    }
    setGenerating(true);
    try {
      const content = await generateSection(block.type, isoContext);
      updateBlockContent(block.id, content);
      if (!block.isExpanded) toggleBlock(block.id);
    } catch (e) {
      console.error('Falha ao gerar seção:', e);
      alert('Falha ao gerar a seção. Verifique a chave da DeepSeek e tente novamente.');
    } finally {
      setGenerating(false);
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={clsx(
        "bg-white rounded-xl border shadow-sm transition-all",
        isDragging ? "border-orange-400 shadow-lg ring-2 ring-orange-100" : "border-slate-200 hover:border-slate-300"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
        <button
          {...attributes}
          {...listeners}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <button 
          onClick={() => toggleBlock(block.id)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          {block.isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
          <span className="font-semibold text-slate-700 text-sm">{block.title}</span>
        </button>

        {isGeneratable(block.type) && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            title="Gerar esta seção com IA a partir dos documentos importados"
            className="flex items-center gap-1.5 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 px-2.5 py-1.5 rounded-md transition-colors disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {generating ? 'Gerando...' : 'Gerar IA'}
          </button>
        )}

        <button
          onClick={() => removeBlock(block.id)}
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      {block.isExpanded && (
        <div className="p-6">
          {children}
        </div>
      )}
    </motion.div>
  );
}
