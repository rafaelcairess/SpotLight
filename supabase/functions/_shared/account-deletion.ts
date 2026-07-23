/**
 * PostgREST usa esta expressão para localizar pedidos em qualquer direção.
 * Manter os nomes das colunas em um helper testável evita divergência entre
 * a Edge Function e a migration da tabela.
 */
export const buildFriendRequestDeletionFilter = (userId: string) =>
  `requester_id.eq.${userId},addressee_id.eq.${userId}`;
