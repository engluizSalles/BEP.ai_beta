import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useBEPStore } from '../../store/bepStore';
import { Plus, FolderOpen, Upload, Trash2, FileText, ArrowRight } from 'lucide-react';

export function Home() {
  const { projects, createProject, openProject, deleteProject, importProject } = useBEPStore();
  const [newName, setNewName] = useState('');

  const handleCreate = () => {
    createProject(newName);
    setNewName('');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.blocks)) throw new Error('Arquivo inválido.');
      const name = data.name || file.name.replace(/\.json$/i, '');
      importProject({ blocks: data.blocks }, name);
    } catch (err) {
      console.error('Import failed', err);
      alert('Falha ao importar. Verifique se o .json é um projeto BEP válido.');
    } finally {
      e.target.value = '';
    }
  };

  const fmtDate = (ts: number) => new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl w-full z-10"
      >
        {/* Cabeçalho */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-slate-900/20">
            <span className="text-white font-black text-2xl tracking-tighter">B.ai</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
            BEP<span className="text-orange-600">.ai</span>
          </h1>
          <p className="text-slate-600 max-w-md mx-auto">
            Planos de Execução BIM (ISO 19650 / NBR 15965). Crie um novo projeto ou continue um existente.
          </p>
        </div>

        {/* Novo projeto */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Novo projeto</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Nome do projeto (ex.: Terminal Rodoviário)"
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
            />
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Criar
            </button>
          </div>
          <div className="mt-3">
            <input type="file" accept=".json" onChange={handleImport} className="hidden" id="home-import" />
            <label
              htmlFor="home-import"
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-orange-600 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Importar projeto (.json)
            </label>
          </div>
        </div>

        {/* Projetos existentes */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Projetos existentes
          </h2>

          {projects.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-60" />
              <p className="text-sm">Nenhum projeto ainda. Crie o primeiro acima.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {projects.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-3 group">
                  <FolderOpen className="w-4 h-4 text-slate-400 shrink-0" />
                  <button onClick={() => openProject(p.id)} className="flex-1 text-left min-w-0">
                    <span className="block font-medium text-slate-800 text-sm truncate">{p.name}</span>
                    <span className="block text-xs text-slate-400">Atualizado em {fmtDate(p.updatedAt)}</span>
                  </button>
                  <button
                    onClick={() => openProject(p.id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-md transition-colors"
                  >
                    Abrir
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Excluir o projeto "${p.name}"? Esta ação não pode ser desfeita.`)) deleteProject(p.id);
                    }}
                    title="Excluir projeto"
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  );
}
