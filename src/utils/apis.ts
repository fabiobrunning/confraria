// Utility functions for external APIs

export const fetchAddressByCep = async (cep: string) => {
  const cleanCep = cep.replace(/\D/g, "");
  if (cleanCep.length !== 8) {
    throw new Error("CEP inválido");
  }

  const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
  const data = await response.json();

  if (data.erro) {
    throw new Error("CEP não encontrado");
  }

  return {
    street: data.logradouro,
    neighborhood: data.bairro,
    city: data.localidade,
    state: data.uf,
  };
};

export const fetchCompanyByCnpj = async (cnpj: string) => {
  const cleanCnpj = cnpj.replace(/\D/g, "");
  if (cleanCnpj.length !== 14) {
    throw new Error("CNPJ inválido");
  }

  const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
  const data = await response.json();

  if (data.message) {
    throw new Error("CNPJ não encontrado");
  }

  return {
    name: data.razao_social || data.nome_fantasia,
    street: data.logradouro,
    number: data.numero,
    complement: data.complemento,
    neighborhood: data.bairro,
    city: data.municipio,
    state: data.uf,
    cep: data.cep,
  };
};
