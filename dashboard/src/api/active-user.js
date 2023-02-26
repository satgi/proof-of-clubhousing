import { gql, apolloClient } from '@/api/graphql';

export function fetchActiveUserStats(variables) {
  return apolloClient.query({
    query: gql`
      query fetchActiveUserStats($start: Int, $end: Int, $level: String) {
        activeUserStats(start: $start, end: $end, level: $level) {
          amount
          date
        }
      }
    `,
    variables,
    fetchPolicy: 'no-cache',
  });
}
