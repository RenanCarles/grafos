import { HttpErrorResponse } from '@angular/common/http';
import { mensagemDe } from './mensagem-de-erro';

describe('mensagens de erro da API', () => {
  it('orienta como recuperar uma conexão indisponível', () => {
    expect(mensagemDe(new HttpErrorResponse({ status: 0 }))).toContain('porta 8000');
  });
  it('distingue dados ausentes de falha de conexão', () => {
    expect(mensagemDe(new HttpErrorResponse({ status: 503 }))).toContain('Gere os dados');
    expect(mensagemDe(new Error('Resposta inválida'))).toBe('Resposta inválida');
  });

  it('mostra o motivo quando a visão não pode ser gravada', () => {
    expect(
      mensagemDe(new HttpErrorResponse({ status: 400, error: { detail: 'O nome é inválido.' } })),
    ).toBe('O nome é inválido.');
    expect(mensagemDe(new HttpErrorResponse({ status: 404, error: {} }))).toContain('HTTP 404');
  });
});
