#!/usr/bin/env node
// Launcher cross-plataforma para o CLI `notebooklm-py`.
//
// Problema: `pip install notebooklm-py` instala o executável `notebooklm` num
// diretório de Scripts que NEM SEMPRE está no PATH (no Windows costuma cair em
// %APPDATA%\Python\PythonXY\Scripts, fora do PATH). Além disso, o nome do
// interpretador varia por máquina (`python`, `py`, `python3`).
//
// Este launcher tenta as mesmas formas de invocação que o bridge do dev server
// (vite-plugin-notebooklm.mjs), na ordem mais confiável, e repassa os args.
// Assim `npm run notebooklm:login` etc. funcionam em qualquer máquina.

import { spawnSync } from 'node:child_process';

// Ordem de tentativa. `python -m notebooklm` é o caminho mais confiável quando
// o executável não está no PATH.
const INVOCATIONS = [
  { cmd: 'notebooklm', base: [] },
  { cmd: 'python', base: ['-m', 'notebooklm'] },
  { cmd: 'py', base: ['-m', 'notebooklm'] },
  { cmd: 'python3', base: ['-m', 'notebooklm'] },
];

const args = process.argv.slice(2);

// Descobre uma invocação válida testando `--version` (silencioso).
function resolveInvocation() {
  for (const inv of INVOCATIONS) {
    const probe = spawnSync(inv.cmd, [...inv.base, '--version'], {
      stdio: 'ignore',
      shell: false,
    });
    // ENOENT => comando não existe; tenta o próximo.
    if (probe.error && probe.error.code === 'ENOENT') continue;
    // Existe (mesmo que --version retorne != 0): é uma invocação válida.
    return inv;
  }
  return null;
}

const inv = resolveInvocation();

if (!inv) {
  console.error(
    [
      'CLI "notebooklm" não encontrado.',
      'Instale (uma vez): npm run setup   (roda `pip install notebooklm-py`)',
      'Ou direto:          pip install notebooklm-py',
    ].join('\n'),
  );
  process.exit(1);
}

const run = spawnSync(inv.cmd, [...inv.base, ...args], {
  stdio: 'inherit', // herda stdin/stdout/stderr (login interativo, prompts).
  shell: false,
});

if (run.error) {
  console.error(`Falha ao executar notebooklm: ${run.error.message}`);
  process.exit(1);
}

process.exit(run.status ?? 0);
