export function mensagemDe(erro: unknown): string {
  return erro instanceof Error && erro.message ? erro.message : 'Ocorreu um erro inesperado.';
}
