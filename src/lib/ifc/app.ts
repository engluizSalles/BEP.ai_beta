import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import * as OBCF from '@thatopen/components-front';
import * as BUI from '@thatopen/ui';
import * as BUIC from '@thatopen/ui-obc';
import { extractIfcSummary } from './extract';
import { analyzeConsistency, type ConsistencyReport } from '../analysis';
import { useBEPStore } from '../../store/bepStore';

let buiInitialized = false;

export interface IfcApp {
  dispose(): void;
}

type ReportState =
  | { status: 'idle' }
  | { status: 'analyzing' }
  | { status: 'error'; error: string }
  | { status: 'done'; data: ConsistencyReport };

/**
 * Monta a interface completa de visualização/análise de IFC (espelhada no viewer de
 * referência 07.bim_ai/3.viewer): viewport 3D, lista de modelos, árvore espacial,
 * tabela de propriedades, toolbar de vistas e drag-and-drop — somando um painel de
 * Análise de Consistência BEP × IFC. Tudo com web components do ThatOpen (@thatopen/ui).
 */
export async function mountIfcApp(host: HTMLElement): Promise<IfcApp> {
  if (!buiInitialized) {
    BUI.Manager.init();
    buiInitialized = true;
  }

  // ── Engine: cena, câmera, renderer ──────────────────────────────────────
  const components = new OBC.Components();
  const worlds = components.get(OBC.Worlds);
  const world = worlds.create<OBC.SimpleScene, OBC.SimpleCamera, OBC.SimpleRenderer>();
  world.name = 'main';

  const viewport = document.createElement('bim-viewport');

  const sceneComponent = new OBC.SimpleScene(components);
  sceneComponent.setup();
  world.scene = sceneComponent;

  const rendererComponent = new OBC.SimpleRenderer(components, viewport);
  world.renderer = rendererComponent;

  const cameraComponent = new OBC.SimpleCamera(components);
  world.camera = cameraComponent;

  viewport.addEventListener('resize', () => {
    rendererComponent.resize();
    cameraComponent.updateAspect();
  });

  components.get(OBC.Grids).create(world);
  components.init();

  // ── IFC Loader (WASM local de public/) ──────────────────────────────────
  const ifcLoader = components.get(OBC.IfcLoader);
  await ifcLoader.setup({ autoSetWasm: false, wasm: { path: '/', absolute: true } });

  // ── Fragments Manager ───────────────────────────────────────────────────
  const workerUrl = await OBC.FragmentsManager.getWorker();
  const fragments = components.get(OBC.FragmentsManager);
  fragments.init(workerUrl);

  world.camera.controls.addEventListener('update', () => fragments.core.update());
  fragments.list.onItemSet.add(async ({ value: model }) => {
    model.useCamera(world.camera.three);
    world.scene.three.add(model.object);
    await fragments.core.update(true);
  });
  fragments.list.onCleared.add(async () => {
    await fragments.core.update(true);
  });

  // ── Highlighter (seleção por clique) ────────────────────────────────────
  const highlighter = components.get(OBCF.Highlighter);
  highlighter.setup({ world });
  highlighter.zoomToSelection = true;

  // ── Estado / helpers ────────────────────────────────────────────────────
  let currentFile: File | null = null;

  async function fitScene() {
    const box = new THREE.Box3().setFromObject(world.scene.three);
    if (box.isEmpty()) return;
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    await world.camera.controls.fitToSphere(sphere, true);
  }

  async function setView(axis: 'top' | 'front') {
    const box = new THREE.Box3().setFromObject(world.scene.three);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const d = Math.max(size.x, size.y, size.z) * 2;
    if (axis === 'top') {
      await world.camera.controls.setLookAt(center.x, center.y + d, center.z, center.x, center.y, center.z, true);
    } else {
      await world.camera.controls.setLookAt(center.x, center.y, center.z + d, center.x, center.y, center.z, true);
    }
  }

  async function loadFile(file: File) {
    const overlay = viewport.querySelector('.bep-loading') as HTMLElement | null;
    if (overlay) overlay.style.display = 'flex';
    try {
      currentFile = file;
      const data = new Uint8Array(await file.arrayBuffer());
      const model = await ifcLoader.load(data, true, file.name);
      const box = new THREE.Box3().setFromObject(model.object);
      const sphere = new THREE.Sphere();
      box.getBoundingSphere(sphere);
      await world.camera.controls.fitToSphere(sphere, true);
    } catch (error) {
      console.error('Erro ao carregar IFC:', error);
      alert(`Erro ao carregar o arquivo IFC: ${error}`);
    } finally {
      if (overlay) overlay.style.display = 'none';
    }
  }

  function pickFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ifc';
    input.onchange = async () => {
      if (input.files?.length) await loadFile(input.files[0]);
    };
    input.click();
  }

  async function loadExample() {
    const res = await fetch('/exemplo.ifc');
    if (!res.ok) {
      alert('Exemplo não encontrado em public/exemplo.ifc.');
      return;
    }
    const blob = await res.blob();
    await loadFile(new File([blob], 'exemplo.ifc'));
  }

  // ── Componentes de UI prontos (@thatopen/ui-obc) ────────────────────────
  const [modelsList] = BUIC.tables.modelsList({
    components,
    metaDataTags: ['schema'],
    actions: { download: false },
  });

  const [spatialTree] = BUIC.tables.spatialTree({ components, models: [] });
  spatialTree.preserveStructureOnFilter = true;

  const [propertiesTable, updatePropertiesTable] = BUIC.tables.itemsData({
    components,
    modelIdMap: {},
  });
  propertiesTable.preserveStructureOnFilter = true;

  highlighter.events.select.onHighlight.add((modelIdMap) => updatePropertiesTable({ modelIdMap }));
  highlighter.events.select.onClear.add(() => updatePropertiesTable({ modelIdMap: {} }));

  // ── Análise de consistência (BEP × IFC) ─────────────────────────────────
  function statusColor(s: 'ok' | 'alerta' | 'erro') {
    return s === 'ok' ? '#10b981' : s === 'erro' ? '#ef4444' : '#f59e0b';
  }

  function renderReport(reportState: ReportState) {
    if (reportState.status === 'analyzing') {
      return BUI.html`<bim-label>Analisando consistência via IA...</bim-label>`;
    }
    if (reportState.status === 'error') {
      return BUI.html`<bim-label style="--bim-label--c: #ef4444; white-space: normal;">${reportState.error}</bim-label>`;
    }
    if (reportState.status !== 'done') {
      return BUI.html`<bim-label style="--bim-label--c: var(--bim-ui_bg-contrast-40); white-space: normal;">
        Carregue um IFC e clique em "Analisar consistência". Preencha o BEP no Editor para uma análise melhor.
      </bim-label>`;
    }
    const data = reportState.data;
    return BUI.html`
      <bim-label style="white-space: normal; --bim-label--c: #ffffff; color: #ffffff;">${data.summary}</bim-label>
      ${(data.checks ?? []).map(
        (c) => BUI.html`
          <div style="display:flex; gap:8px; padding:6px 0; border-bottom:1px solid var(--bim-ui_bg-contrast-20); color:#ffffff;">
            <span style="color:${statusColor(c.status)}; font-weight:700; line-height:1.2;">●</span>
            <div>
              <div style="font-weight:600; font-size:0.8rem; color:#ffffff;">${c.item}</div>
              <div style="font-size:0.72rem; color:#ffffff; opacity:0.85;">${c.detail}</div>
            </div>
          </div>
        `,
      )}
    `;
  }

  async function analyze() {
    if (!currentFile) {
      setReport({ status: 'error', error: 'Carregue um IFC antes de analisar.' });
      return;
    }
    setReport({ status: 'analyzing' });
    try {
      const summary = await extractIfcSummary(currentFile);
      const data = await analyzeConsistency(summary, useBEPStore.getState().blocks);
      setReport({ status: 'done', data });
    } catch (err: any) {
      console.error('Análise de consistência falhou:', err);
      setReport({ status: 'error', error: err?.message ?? 'Falha na análise (verifique a chave da DeepSeek).' });
    }
  }

  // Componente STATEFUL: a forma de 2 argumentos retorna a função de update,
  // que re-renderiza o painel quando o estado do relatório muda.
  const [consistencySection, updateConsistency] = BUI.Component.create<
    HTMLElement,
    { report: ReportState }
  >(
    (state) => BUI.html`
      <bim-panel-section label="Consistência BEP × IFC" icon="solar:check-circle-bold">
        <bim-button
          label="Analisar consistência"
          icon="solar:magic-stick-3-bold"
          @click=${analyze}
        ></bim-button>
        ${renderReport(state.report)}
      </bim-panel-section>
    `,
    { report: { status: 'idle' } },
  );

  function setReport(s: ReportState) {
    updateConsistency({ report: s });
  }

  // ── Painéis ─────────────────────────────────────────────────────────────
  const leftPanel = BUI.Component.create(
    () => BUI.html`
      <bim-panel label="Modelos">
        <bim-panel-section label="Importar" icon="solar:import-bold">
          <bim-button label="Carregar IFC" icon="solar:upload-bold" @click=${pickFile}></bim-button>
          <bim-button label="Carregar exemplo" icon="solar:home-bold" @click=${loadExample}></bim-button>
        </bim-panel-section>
        <bim-panel-section label="Modelos Carregados" icon="solar:list-bold">
          ${modelsList}
        </bim-panel-section>
        <bim-panel-section label="Árvore Espacial" icon="solar:folder-with-files-bold" collapsed>
          <bim-text-input
            placeholder="Buscar..."
            @input=${(e: Event) => {
              spatialTree.queryString = (e.target as HTMLInputElement).value;
            }}
          ></bim-text-input>
          ${spatialTree}
        </bim-panel-section>
      </bim-panel>
    `,
  );

  const rightPanel = BUI.Component.create(
    () => BUI.html`
      <bim-panel label="Propriedades & Análise">
        <bim-panel-section label="Dados do Elemento" icon="solar:document-text-bold">
          <bim-label style="--bim-label--c: var(--bim-ui_bg-contrast-40)">
            Clique em um elemento para ver suas propriedades
          </bim-label>
          ${propertiesTable}
        </bim-panel-section>
        ${consistencySection}
      </bim-panel>
    `,
  );

  const toolbar = BUI.Component.create(
    () => BUI.html`
      <bim-toolbar>
        <bim-toolbar-section label="Visualização">
          <bim-button label="Enquadrar Tudo" icon="solar:maximize-square-bold" @click=${fitScene}></bim-button>
          <bim-button label="Vista Superior" icon="solar:arrow-up-bold" @click=${() => setView('top')}></bim-button>
          <bim-button label="Vista Frontal" icon="solar:arrow-right-bold" @click=${() => setView('front')}></bim-button>
        </bim-toolbar-section>
        <bim-toolbar-section label="Painéis">
          <bim-button
            label="Modelos"
            icon="solar:sidebar-minimalistic-bold"
            @click=${() => {
              (app as any).layout = (app as any).layout === 'main' ? 'no-left' : 'main';
            }}
          ></bim-button>
          <bim-button
            label="Propriedades"
            icon="solar:document-text-bold"
            @click=${() => {
              (app as any).layout = (app as any).layout === 'no-right' ? 'main' : 'no-right';
            }}
          ></bim-button>
        </bim-toolbar-section>
      </bim-toolbar>
    `,
  );

  // Overlay de carregamento + dica de drag-and-drop dentro do viewport.
  const overlay = document.createElement('div');
  overlay.className = 'bep-loading';
  overlay.style.cssText =
    'display:none; position:absolute; inset:0; align-items:center; justify-content:center; background:rgba(15,23,42,0.6); color:#fff; font-size:0.9rem; z-index:5;';
  overlay.textContent = 'Carregando modelo IFC...';
  viewport.appendChild(overlay);

  // ── Layout com bim-grid (montado dentro do host React) ──────────────────
  const app = document.createElement('bim-grid') as BUI.Grid;
  app.style.width = '100%';
  app.style.height = '100%';
  (app as any).layouts = {
    main: {
      template: `
        "toolbar toolbar toolbar" auto
        "leftPanel viewport rightPanel" 1fr
        / 20rem 1fr 24rem
      `,
      elements: { toolbar, leftPanel, viewport, rightPanel },
    },
    'no-left': {
      template: `
        "toolbar toolbar" auto
        "viewport rightPanel" 1fr
        / 1fr 24rem
      `,
      elements: { toolbar, viewport, rightPanel },
    },
    'no-right': {
      template: `
        "toolbar toolbar" auto
        "leftPanel viewport" 1fr
        / 20rem 1fr
      `,
      elements: { toolbar, leftPanel, viewport },
    },
  };
  (app as any).layout = 'main';
  host.appendChild(app);

  // ── Drag-and-drop de arquivos IFC ───────────────────────────────────────
  viewport.addEventListener('dragover', (e) => e.preventDefault());
  viewport.addEventListener('drop', async (e) => {
    e.preventDefault();
    const files = (e as DragEvent).dataTransfer?.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      if (files[i].name.toLowerCase().endsWith('.ifc')) await loadFile(files[i]);
    }
  });

  return {
    dispose() {
      try {
        components.dispose();
      } catch {
        /* ignore */
      }
      if (host.contains(app)) host.removeChild(app);
    },
  };
}
