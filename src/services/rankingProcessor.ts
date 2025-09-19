/**
 * Sistema de Processamento de Rankings de Competição
 * Extrai dados de screenshots de ranking e consolida em estrutura JSON
 */

export interface TeamRankingData {
  identificador: string;
  posicao: number;
  baixas: number;
  tempo_sobrevivencia: string;
  pontuacao_calculada: number;
}

export interface RodadaData {
  equipes: TeamRankingData[];
}

export interface ConsolidatedRanking {
  [key: string]: RodadaData;
}

export interface FinalRanking {
  identificador: string;
  nome_real?: string;
  pontuacao_total: number;
  total_baixas: number;
  melhor_posicao: number;
  participacoes: number;
  tempo_medio_sobrevivencia: string;
}

export interface RankingStats {
  equipe_mais_baixas: {
    identificador: string;
    total_baixas: number;
  };
  maior_tempo_sobrevivencia: {
    identificador: string;
    tempo: string;
    rodada: string;
  };
  mais_consistente: {
    identificador: string;
    posicao_media: number;
  };
}

/**
 * Configuração do sistema de pontuação
 */
export const SCORING_CONFIG = {
  // Pontos por posição (1º lugar = 25 pontos, 2º = 20, etc.)
  positionPoints: {
    1: 25, 2: 20, 3: 18, 4: 16, 5: 14, 6: 12, 7: 10, 8: 8, 9: 6, 10: 4,
    11: 3, 12: 2, 13: 1, 14: 1, 15: 1, 16: 1, 17: 1, 18: 1, 19: 1, 20: 1,
    21: 0, 22: 0, 23: 0, 24: 0, 25: 0
  },
  // Pontos por eliminação
  killPoints: 1
};

/**
 * Mapeamento de identificadores para nomes reais das equipes
 */
export const TEAM_MAPPING: Record<string, string> = {
  'EQUIPE1': 'Equipe Alpha',
  'EQUIPE2': 'Equipe Beta',
  'EQUIPE3': 'Equipe Gamma',
  'EQUIPE4': 'Equipe Delta',
  'EQUIPE5': 'Equipe Epsilon',
  'EQUIPE6': 'Equipe Zeta',
  'EQUIPE7': 'Equipe Eta',
  'EQUIPE8': 'Equipe Theta',
  'EQUIPE9': 'Equipe Iota',
  'EQUIPE10': 'Equipe Kappa',
  'EQUIPE11': 'Equipe Lambda',
  'EQUIPE12': 'Equipe Mu',
  'EQUIPE13': 'Equipe Nu',
  'EQUIPE14': 'Equipe Xi',
  'EQUIPE15': 'Equipe Omicron',
  'EQUIPE16': 'Equipe Pi',
  'EQUIPE17': 'Equipe Rho',
  'EQUIPE18': 'Equipe Sigma',
  'EQUIPE19': 'Equipe Tau',
  'EQUIPE20': 'Equipe Upsilon',
  'EQUIPE21': 'Equipe Phi',
  'EQUIPE22': 'Equipe Chi',
  'EQUIPE23': 'Equipe Psi',
  'EQUIPE24': 'Equipe Omega',
  'EQUIPE25': 'Equipe Phoenix'
};

export class RankingProcessor {
  /**
   * Calcula a pontuação de uma equipe baseada na posição e baixas
   */
  static calculateScore(posicao: number, baixas: number): number {
    const positionScore = SCORING_CONFIG.positionPoints[posicao] || 0;
    const killScore = baixas * SCORING_CONFIG.killPoints;
    return positionScore + killScore;
  }

  /**
   * Converte tempo MM:SS para segundos para cálculos
   */
  static timeToSeconds(timeString: string): number {
    const [minutes, seconds] = timeString.split(':').map(Number);
    return minutes * 60 + seconds;
  }

  /**
   * Converte segundos de volta para formato MM:SS
   */
  static secondsToTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Processa dados extraídos das imagens e calcula pontuações
   */
  static processRankingData(rawData: ConsolidatedRanking): ConsolidatedRanking {
    const processedData: ConsolidatedRanking = {};

    Object.keys(rawData).forEach(rodada => {
      processedData[rodada] = {
        equipes: rawData[rodada].equipes.map(equipe => ({
          ...equipe,
          pontuacao_calculada: this.calculateScore(equipe.posicao, equipe.baixas)
        }))
      };
    });

    return processedData;
  }

  /**
   * Gera classificação final consolidada
   */
  static generateFinalRanking(data: ConsolidatedRanking): FinalRanking[] {
    const teamStats: Record<string, {
      pontuacao_total: number;
      total_baixas: number;
      posicoes: number[];
      tempos: number[];
      participacoes: number;
    }> = {};

    // Consolida dados de todas as rodadas
    Object.keys(data).forEach(rodada => {
      data[rodada].equipes.forEach(equipe => {
        if (!teamStats[equipe.identificador]) {
          teamStats[equipe.identificador] = {
            pontuacao_total: 0,
            total_baixas: 0,
            posicoes: [],
            tempos: [],
            participacoes: 0
          };
        }

        const stats = teamStats[equipe.identificador];
        stats.pontuacao_total += equipe.pontuacao_calculada;
        stats.total_baixas += equipe.baixas;
        stats.posicoes.push(equipe.posicao);
        stats.tempos.push(this.timeToSeconds(equipe.tempo_sobrevivencia));
        stats.participacoes++;
      });
    });

    // Gera ranking final
    const finalRanking: FinalRanking[] = Object.keys(teamStats).map(identificador => {
      const stats = teamStats[identificador];
      const tempoMedio = Math.round(stats.tempos.reduce((a, b) => a + b, 0) / stats.tempos.length);
      
      return {
        identificador,
        nome_real: TEAM_MAPPING[identificador],
        pontuacao_total: stats.pontuacao_total,
        total_baixas: stats.total_baixas,
        melhor_posicao: Math.min(...stats.posicoes),
        participacoes: stats.participacoes,
        tempo_medio_sobrevivencia: this.secondsToTime(tempoMedio)
      };
    });

    // Ordena por pontuação total (decrescente)
    return finalRanking.sort((a, b) => b.pontuacao_total - a.pontuacao_total);
  }

  /**
   * Gera estatísticas interessantes do campeonato
   */
  static generateStats(data: ConsolidatedRanking): RankingStats {
    let equipeMaisBaixas = { identificador: '', total_baixas: 0 };
    let maiorTempo = { identificador: '', tempo: '0:00', rodada: '', segundos: 0 };
    const posicoesPorEquipe: Record<string, number[]> = {};

    Object.keys(data).forEach(rodada => {
      data[rodada].equipes.forEach(equipe => {
        // Equipe com mais baixas
        if (equipe.baixas > equipeMaisBaixas.total_baixas) {
          equipeMaisBaixas = {
            identificador: equipe.identificador,
            total_baixas: equipe.baixas
          };
        }

        // Maior tempo de sobrevivência
        const segundos = this.timeToSeconds(equipe.tempo_sobrevivencia);
        if (segundos > maiorTempo.segundos) {
          maiorTempo = {
            identificador: equipe.identificador,
            tempo: equipe.tempo_sobrevivencia,
            rodada,
            segundos
          };
        }

        // Coleta posições para calcular consistência
        if (!posicoesPorEquipe[equipe.identificador]) {
          posicoesPorEquipe[equipe.identificador] = [];
        }
        posicoesPorEquipe[equipe.identificador].push(equipe.posicao);
      });
    });

    // Equipe mais consistente (menor variação nas posições)
    let maisConsistente = { identificador: '', posicao_media: 0 };
    let menorVariacao = Infinity;

    Object.keys(posicoesPorEquipe).forEach(identificador => {
      const posicoes = posicoesPorEquipe[identificador];
      const media = posicoes.reduce((a, b) => a + b, 0) / posicoes.length;
      const variacao = Math.sqrt(posicoes.reduce((acc, pos) => acc + Math.pow(pos - media, 2), 0) / posicoes.length);
      
      if (variacao < menorVariacao) {
        menorVariacao = variacao;
        maisConsistente = {
          identificador,
          posicao_media: Math.round(media * 10) / 10
        };
      }
    });

    return {
      equipe_mais_baixas: equipeMaisBaixas,
      maior_tempo_sobrevivencia: {
        identificador: maiorTempo.identificador,
        tempo: maiorTempo.tempo,
        rodada: maiorTempo.rodada
      },
      mais_consistente: maisConsistente
    };
  }

  /**
   * Valida se os dados extraídos fazem sentido
   */
  static validateData(data: ConsolidatedRanking): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    Object.keys(data).forEach(rodada => {
      const equipes = data[rodada].equipes;
      
      // Verifica posições duplicadas
      const posicoes = equipes.map(e => e.posicao);
      const posicoesDuplicadas = posicoes.filter((pos, index) => posicoes.indexOf(pos) !== index);
      if (posicoesDuplicadas.length > 0) {
        errors.push(`Rodada ${rodada}: Posições duplicadas encontradas: ${posicoesDuplicadas.join(', ')}`);
      }

      // Verifica tempos válidos
      equipes.forEach(equipe => {
        const timeRegex = /^\d{1,2}:\d{2}$/;
        if (!timeRegex.test(equipe.tempo_sobrevivencia)) {
          errors.push(`Rodada ${rodada}, ${equipe.identificador}: Tempo inválido '${equipe.tempo_sobrevivencia}'`);
        }
      });

      // Verifica baixas não negativas
      equipes.forEach(equipe => {
        if (equipe.baixas < 0) {
          errors.push(`Rodada ${rodada}, ${equipe.identificador}: Baixas negativas (${equipe.baixas})`);
        }
      });
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}