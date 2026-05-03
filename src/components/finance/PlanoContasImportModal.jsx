import { Download, FileText, Upload } from 'lucide-react';
import { useState } from 'react';
import Alert from '../shared/Alert';
import Button from '../shared/Button';
import FormField from '../shared/FormField';
import Modal from '../shared/Modal';
import {
  getDefaultPlanoContasText,
  getTemplateCsvRows,
} from '../../utils/planoContasImport';
import { exportToCSV } from '../../utils/csv';
import {
  importPlanoContasFromText,
  previewPlanoContasImport,
} from '../../services/planoContasService';

function PreviewMetric({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}

export default function PlanoContasImportModal({ scope, onClose, onImported }) {
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');

  const hasOwner = Boolean(scope?.effectiveUserId);

  const resetPreview = (nextText) => {
    setText(nextText);
    setPreview(null);
    setError('');
  };

  const handlePreview = async (sourceText = text) => {
    setLoadingPreview(true);
    setError('');

    try {
      if (!hasOwner) {
        throw new Error('Selecione um cliente antes de importar o plano de contas.');
      }
      if (!sourceText.trim()) {
        throw new Error('Cole um texto ou importe um arquivo CSV antes de visualizar.');
      }

      const result = await previewPlanoContasImport(sourceText, scope);
      setPreview(result);
    } catch (err) {
      setPreview(null);
      setError(err.message || 'Nao foi possivel gerar a pre-visualizacao.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      setFileName(file.name);
      resetPreview(content);
    } catch (err) {
      setError(err.message || 'Nao foi possivel ler o arquivo selecionado.');
    } finally {
      event.target.value = '';
    }
  };

  const handleDefaultModel = async () => {
    const defaultText = getDefaultPlanoContasText();
    setFileName('Modelo padrao');
    resetPreview(defaultText);
    await handlePreview(defaultText);
  };

  const handleDownloadTemplate = () => {
    exportToCSV('modelo-plano-contas.csv', getTemplateCsvRows(), ['Conta', 'Subconta', 'Tipo']);
  };

  const handleConfirm = async () => {
    setImporting(true);
    setError('');

    try {
      const result = await importPlanoContasFromText(text, scope);
      await onImported?.(result);
      onClose();
    } catch (err) {
      setError(err.message || 'Nao foi possivel importar o plano de contas.');
    } finally {
      setImporting(false);
    }
  };

  const canConfirm = preview?.podeImportar && !preview?.linhasInvalidas?.length && !importing;

  return (
    <Modal
      title="Importar Plano de Contas"
      description="Cole dados, envie um CSV ou use o modelo padrao antes de confirmar a gravacao."
      onClose={onClose}
    >
      <div className="space-y-4 p-3 sm:p-4">
        <Alert variant="error">{error}</Alert>

        {!hasOwner ? (
          <Alert variant="info">Admin fora da visao de cliente deve selecionar um cliente antes de importar.</Alert>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-3">
          <Button variant="secondary" className="w-full" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4" />
            Baixar modelo CSV
          </Button>
          <Button variant="secondary" className="w-full" onClick={handleDefaultModel} disabled={!hasOwner || loadingPreview}>
            <FileText className="h-4 w-4" />
            Importar modelo padrao
          </Button>
          <label className="btn-secondary flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 normal-case tracking-normal">
            <Upload className="h-4 w-4" />
            Importar CSV
            <input type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={handleFileChange} />
          </label>
        </div>

        {fileName ? (
          <p className="text-sm font-semibold text-slate-600">Arquivo/origem: {fileName}</p>
        ) : null}

        <FormField id="planoContasImportText" label="Texto ou CSV">
          <textarea
            id="planoContasImportText"
            className="min-h-52"
            placeholder={'Conta,Subconta,Tipo\nZootécnico,Área usada para pecuária,Receita\nAdministrativo,Combustível e Lubrificante,Despesa'}
            value={text}
            onChange={(event) => resetPreview(event.target.value)}
          />
        </FormField>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" className="w-full sm:w-auto" onClick={onClose}>Cancelar</Button>
          <Button variant="secondary" className="w-full sm:w-auto" onClick={() => handlePreview()} disabled={!hasOwner || loadingPreview}>
            {loadingPreview ? 'Gerando...' : 'Pre-visualizar'}
          </Button>
          <Button className="w-full sm:w-auto" onClick={handleConfirm} disabled={!canConfirm}>
            {importing ? 'Importando...' : 'Confirmar Importacao'}
          </Button>
        </div>

        {preview ? (
          <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <PreviewMetric label="Linhas lidas" value={preview.totalLinhas} />
              <PreviewMetric label="Contas novas" value={preview.contasNovas} />
              <PreviewMetric label="Contas existentes" value={preview.contasExistentes} />
              <PreviewMetric label="Subcontas novas" value={preview.subcontasNovas} />
              <PreviewMetric label="Duplicadas ignoradas" value={preview.subcontasDuplicadasIgnoradas} />
              <PreviewMetric label="Erros" value={preview.linhasInvalidas.length} />
            </div>

            {preview.linhasInvalidas.length ? (
              <div className="mt-4 rounded-md border border-red-100 bg-red-50 p-3">
                <p className="text-sm font-bold text-red-700">Linhas invalidas</p>
                <div className="mt-2 max-h-36 overflow-y-auto text-sm text-red-700">
                  {preview.linhasInvalidas.slice(0, 10).map((line) => (
                    <p key={line.lineNumber}>
                      Linha {line.lineNumber}: {line.error}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            {!preview.podeImportar ? (
              <p className="mt-3 text-sm font-semibold text-slate-600">
                {preview.linhasInvalidas.length
                  ? 'Corrija as linhas invalidas para confirmar.'
                  : 'Nenhuma subconta nova encontrada para importar.'}
              </p>
            ) : null}
          </section>
        ) : null}
      </div>
    </Modal>
  );
}
