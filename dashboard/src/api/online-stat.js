import { gql, apolloClient } from '@/api/graphql';

export function fetchOnlineRankingStats(variables) {
  return apolloClient.query({
    query: gql`
      query onlineRankingStats(
        $start: Int
        $end: Int
        $limit: Int
        $offset: Int
      ) {
        onlineRankingStats(
          start: $start
          end: $end
          limit: $limit
          offset: $offset
        ) {
          entries {
            place
            user {
              username
              name
              photoUrl
              bio
            }
            minutes
            date
          }
          pageInfo {
            total
            limit
            offset
          }
        }
      }
    `,
    variables,
    fetchPolicy: 'no-cache',
  });
}
