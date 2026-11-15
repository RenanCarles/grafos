import { HttpErrorResponse } from '@angular/common/http';

export function mensagemDe(erro: unknown): string {
  if (erro instanceof HttpErrorResponse) {
    if (erro.status === 0 || erro.status === 502 || erro.status === 504) {
      return 'Não foi possível conectar à API. Verifique se o backend está em execução na porta 8000 e tente novamente.';
    }
    if (erro.status === 503)
      return 'Os dados da coleta estão indisponíveis. Gere os dados no backend e tente novamente.';
    const detalhe = erro.error?.detail;
    if (
      (erro.status === 400 || erro.status === 404) &&
      typeof detalhe === 'string' &&
      detalhe.trim()
    ) {
      return detalhe;
    }
    return `Não foi possível consultar os dados (HTTP ${erro.status}). Tente novamente.`;
  }
  return erro instanceof Error && erro.message ? erro.message : 'Ocorreu um erro inesperado.';
}
