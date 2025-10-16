import { gql } from '@apollo/client';

export const SEARCH_CHARACTERS = gql`
  query GetCharacters($name: String!) {
    characters(where: { name: { eq: $name } }, first: 10) {
      edges {
        node {
          id
          name
          career
          level
          renownRank
        }
      }
    }
  }
`;

export const GET_CHARACTER = gql`
  query GetCharacter($id: ID!) {
    character(id: $id) {
      id
      name
      level
      renownRank
      career
      items {
        equipSlot
        item {
          id
          name
          description
          type
          slot
          rarity
          armor
          dps
          speed
          levelRequirement
          renownRankRequirement
          itemLevel
          uniqueEquipped
          stats {
            stat
            value
            percentage
          }
          careerRestriction
          raceRestriction
          iconUrl
          talismanSlots
          itemSet {
            id
            name
            bonuses {
              itemsRequired
              bonus {
                ... on ItemStat {
                  stat
                  value
                  percentage
                }
                ... on Ability {
                  name
                  description
                }
              }
            }
          }
          abilities {
            name
          }
          buffs {
            name
          }
        }
        talismans {
          id
          name
          description
          type
          slot
          rarity
          armor
          dps
          speed
          levelRequirement
          renownRankRequirement
          itemLevel
          uniqueEquipped
          stats {
            stat
            value
            percentage
          }
          careerRestriction
          raceRestriction
          iconUrl
          talismanSlots
          itemSet {
            id
            name
            bonuses {
              itemsRequired
              bonus {
                ... on ItemStat {
                  stat
                  value
                  percentage
                }
                ... on Ability {
                  name
                  description
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_POCKET_ITEMS = gql`
  query GetPocketItems($first: Int, $after: String, $last: Int, $before: String, $hasStats: [Stat!], $usableByCareer: Career, $where: ItemFilterInput) {
    items(
      where: $where,
      hasStats: $hasStats,
      usableByCareer: $usableByCareer,
      first: $first,
      after: $after,
      last: $last,
      before: $before,
      order: [
        { rarity: DESC },
        { itemLevel: DESC },
        { name: ASC }
      ]
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        cursor
        node {
          id
          name
          type
          slot
          rarity
          armor
          dps
          speed
          levelRequirement
          renownRankRequirement
          itemLevel
          uniqueEquipped
          stats {
            stat
            value
            percentage
          }
          careerRestriction
          raceRestriction
          iconUrl
          talismanSlots
          itemSet {
            id
            name
          }
        }
      }
      nodes {
        id
        name
        type
        slot
        rarity
        armor
        dps
        speed
        levelRequirement
        renownRankRequirement
        itemLevel
        uniqueEquipped
        stats {
          stat
          value
          percentage
        }
        careerRestriction
        raceRestriction
        iconUrl
        talismanSlots
        itemSet {
          id
          name
        }
      }
      totalCount
    }
  }
`;

export const GET_TALISMANS = gql`
  query GetTalismans($first: Int, $after: String, $last: Int, $before: String, $hasStats: [Stat!], $where: ItemFilterInput) {
    items(
      where: $where,
      hasStats: $hasStats,
      first: $first,
      after: $after,
      last: $last,
      before: $before,
      order: [
        { rarity: DESC },
        { itemLevel: DESC },
        { name: ASC }
      ]
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        cursor
        node {
          id
          name
          type
          slot
          rarity
          armor
          dps
          speed
          levelRequirement
          renownRankRequirement
          itemLevel
          uniqueEquipped
          stats {
            stat
            value
            percentage
          }
          careerRestriction
          raceRestriction
          iconUrl
          talismanSlots
          itemSet {
            id
            name
          }
        }
      }
      nodes {
        id
        name
        type
        slot
        rarity
        armor
        dps
        speed
        levelRequirement
        renownRankRequirement
        itemLevel
        uniqueEquipped
        stats {
          stat
          value
          percentage
        }
        careerRestriction
        raceRestriction
        iconUrl
        talismanSlots
        itemSet {
          id
          name
        }
      }
      totalCount
    }
  }
`;
