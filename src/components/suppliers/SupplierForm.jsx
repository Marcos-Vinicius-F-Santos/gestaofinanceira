import { useEffect, useState } from 'react';
import Button from '../shared/Button';
import FormField from '../shared/FormField';

const initialForm = {
  nomeFantasia: '',
  razaoSocial: '',
  cnpj: '',
  inscricaoEstadual: '',
  telefone: '',
  email: '',
  endereco: '',
  descontoPadrao: '',
  ativo: true,
};

export default function SupplierForm({ currentSupplier, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (!currentSupplier) {
      setForm(initialForm);
      return;
    }

    setForm({
      nomeFantasia: currentSupplier.nomeFantasia || '',
      razaoSocial: currentSupplier.razaoSocial || '',
      cnpj: currentSupplier.cnpj || '',
      inscricaoEstadual: currentSupplier.inscricaoEstadual || '',
      telefone: currentSupplier.telefone || '',
      email: currentSupplier.email || '',
      endereco: currentSupplier.endereco || '',
      descontoPadrao: currentSupplier.descontoPadrao === '' || currentSupplier.descontoPadrao === undefined ? '' : String(currentSupplier.descontoPadrao),
      ativo: currentSupplier.ativo !== false,
    });
  }, [currentSupplier]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit({
      ...form,
      userId: currentSupplier?.userId,
    });

    if (!currentSupplier) {
      setForm(initialForm);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 p-3 sm:p-4">
        <FormField id="supplierNome" label="Nome fantasia">
          <input id="supplierNome" value={form.nomeFantasia} onChange={(event) => update('nomeFantasia', event.target.value)} required />
        </FormField>
        <FormField id="supplierRazao" label="Razao social">
          <input id="supplierRazao" value={form.razaoSocial} onChange={(event) => update('razaoSocial', event.target.value)} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="supplierCnpj" label="CNPJ">
            <input id="supplierCnpj" value={form.cnpj} onChange={(event) => update('cnpj', event.target.value)} />
          </FormField>
          <FormField id="supplierIe" label="Inscricao estadual">
            <input id="supplierIe" value={form.inscricaoEstadual} onChange={(event) => update('inscricaoEstadual', event.target.value)} />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="supplierTelefone" label="Telefone">
            <input id="supplierTelefone" value={form.telefone} onChange={(event) => update('telefone', event.target.value)} />
          </FormField>
          <FormField id="supplierEmail" label="Email">
            <input id="supplierEmail" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} />
          </FormField>
        </div>
        <FormField id="supplierEndereco" label="Endereco">
          <textarea id="supplierEndereco" rows="3" value={form.endereco} onChange={(event) => update('endereco', event.target.value)} />
        </FormField>
        <FormField id="supplierDesconto" label="Desconto padrao (%)">
          <input id="supplierDesconto" type="number" step="0.01" value={form.descontoPadrao} onChange={(event) => update('descontoPadrao', event.target.value)} />
        </FormField>
        <label htmlFor="supplierAtivo" className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-slate-700">
          <input
            id="supplierAtivo"
            type="checkbox"
            className="h-4 w-4"
            checked={form.ativo}
            onChange={(event) => update('ativo', event.target.checked)}
          />
          Fornecedor ativo
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" className="w-full sm:w-auto" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
            {currentSupplier ? 'Salvar fornecedor' : 'Cadastrar fornecedor'}
          </Button>
        </div>
      </div>
    </form>
  );
}
