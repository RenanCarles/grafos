export interface ItemNumero {
  rotulo: string;
  valor: string;
}

export interface ItemRanking {
  posicao: number;
  rotulo: string;
  detalhe: string;
}

export interface CardNumeros {
  tipo: 'numeros';
  id: string;
  titulo: string;
  itens: ItemNumero[];
  nota?: string;
}

export interface CardRanking {
  tipo: 'ranking';
  id: string;
  titulo: string;
  itens: ItemRanking[];
  nota?: string;
}

export type CardMetrica = CardNumeros | CardRanking;
