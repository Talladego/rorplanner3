import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** The `Byte` scalar type represents non-fractional whole numeric values. Byte can represent values between 0 and 255. */
  Byte: { input: any; output: any; }
  /** The `DateTime` scalar represents an ISO-8601 compliant date time type. */
  DateTime: { input: any; output: any; }
  /** The `Long` scalar type represents non-fractional signed whole 64-bit numeric values. Long can represent values between -(2^63) and 2^63 - 1. */
  Long: { input: any; output: any; }
  /** The NonNegativeInt scalar type represents a unsigned 32-bit numeric non-fractional value equal to or greater than 0. */
  NonNegativeInt: { input: any; output: any; }
  /** The `Short` scalar type represents non-fractional signed whole 16-bit numeric values. Short can represent values between -(2^15) and 2^15 - 1. */
  Short: { input: any; output: any; }
  URL: { input: any; output: any; }
  UUID: { input: any; output: any; }
  /** The UnsignedInt scalar type represents a unsigned 32-bit numeric non-fractional value greater than or equal to 0. */
  UnsignedInt: { input: any; output: any; }
  /** The UnsignedLong scalar type represents a unsigned 64-bit numeric non-fractional value greater than or equal to 0. */
  UnsignedLong: { input: any; output: any; }
  /** The UnsignedShort scalar type represents a unsigned 16-bit numeric non-fractional value greater than or equal to 0. */
  UnsignedShort: { input: any; output: any; }
};

export type Ability = SearchContent & {
  readonly __typename?: 'Ability';
  /** @deprecated Use 'info' field instead. */
  readonly abilityType: AbilityType;
  /** @deprecated Use 'info' field instead. */
  readonly actionPointCost: Scalars['Byte']['output'];
  /** @deprecated Use 'info' field instead. */
  readonly castTime: Scalars['UnsignedInt']['output'];
  /** @deprecated Use 'info' field instead. */
  readonly cooldown: Scalars['UnsignedInt']['output'];
  readonly description?: Maybe<Scalars['String']['output']>;
  /** @deprecated Use 'info' field instead. */
  readonly iconUrl: Scalars['String']['output'];
  readonly id: Scalars['ID']['output'];
  readonly info: AbilityInfo;
  /** @deprecated Use 'info' field instead. */
  readonly labels: ReadonlyArray<Maybe<Scalars['String']['output']>>;
  /** @deprecated Use 'info' field instead. */
  readonly minLevel: Scalars['Byte']['output'];
  /** @deprecated Use 'info' field instead. */
  readonly minRange: Scalars['UnsignedShort']['output'];
  /** @deprecated Use 'info' field instead. */
  readonly moraleCost: Scalars['UnsignedShort']['output'];
  /** @deprecated Use 'info' field instead. */
  readonly moraleLevel: Scalars['Byte']['output'];
  /** @deprecated Use 'info' field instead. */
  readonly name?: Maybe<Scalars['String']['output']>;
  /** @deprecated Use 'info' field instead. */
  readonly range: Scalars['UnsignedShort']['output'];
  /** @deprecated Use 'info' field instead. */
  readonly specialization: Scalars['Byte']['output'];
};

export type AbilityInfo = SearchContent & {
  readonly __typename?: 'AbilityInfo';
  readonly abilityType: AbilityType;
  readonly actionPointCost: Scalars['Byte']['output'];
  readonly castTime: Scalars['UnsignedInt']['output'];
  readonly cooldown: Scalars['UnsignedInt']['output'];
  readonly description?: Maybe<Scalars['String']['output']>;
  readonly iconUrl: Scalars['String']['output'];
  readonly id: Scalars['ID']['output'];
  readonly labels: ReadonlyArray<Maybe<Scalars['String']['output']>>;
  readonly minLevel: Scalars['Byte']['output'];
  readonly minRange: Scalars['UnsignedShort']['output'];
  readonly moraleCost: Scalars['UnsignedShort']['output'];
  readonly moraleLevel: Scalars['Byte']['output'];
  readonly name?: Maybe<Scalars['String']['output']>;
  readonly range: Scalars['UnsignedShort']['output'];
  /** Mastery path */
  readonly specialization: Scalars['Byte']['output'];
};


export type AbilityInfoDescriptionArgs = {
  stats: CharacterStatsInput;
};

export type AbilityType =
  /** Regular abilities */
  | 'DEFAULT'
  /** Unused */
  | 'FIRST'
  /** Granted abilities */
  | 'GRANTED'
  | 'GUILD'
  /** Morale abilities */
  | 'MORALE'
  /** Passive buffs */
  | 'PASSIVE'
  /** Pet abilities */
  | 'PET'
  /** Tactics */
  | 'TACTIC'
  | 'TAUNT_GUARD';

/** Player Archetypes */
export type Archetype =
  | 'HEALER'
  | 'MELEE_DPS'
  | 'RANGED_DPS'
  | 'TANK';

/** Holds information about one attacker in a kill */
export type Attacker = {
  readonly __typename?: 'Attacker';
  /** Character information */
  readonly character: Character;
  /** Amount of the total damage done by this attacker */
  readonly damagePercent: Scalars['Byte']['output'];
  /** Guild at the time of the kill */
  readonly guild?: Maybe<Guild>;
  /** Level at the time of the kill */
  readonly level: Scalars['Byte']['output'];
  /** Renown rank at the time of the kill */
  readonly renownRank: Scalars['Byte']['output'];
};

export type BooleanOperationFilterInput = {
  readonly eq?: InputMaybe<Scalars['Boolean']['input']>;
  readonly neq?: InputMaybe<Scalars['Boolean']['input']>;
};

export type ByteOperationFilterInput = {
  readonly eq?: InputMaybe<Scalars['Byte']['input']>;
  readonly gt?: InputMaybe<Scalars['Byte']['input']>;
  readonly gte?: InputMaybe<Scalars['Byte']['input']>;
  readonly in?: InputMaybe<ReadonlyArray<InputMaybe<Scalars['Byte']['input']>>>;
  readonly lt?: InputMaybe<Scalars['Byte']['input']>;
  readonly lte?: InputMaybe<Scalars['Byte']['input']>;
  readonly neq?: InputMaybe<Scalars['Byte']['input']>;
  readonly ngt?: InputMaybe<Scalars['Byte']['input']>;
  readonly ngte?: InputMaybe<Scalars['Byte']['input']>;
  readonly nin?: InputMaybe<ReadonlyArray<InputMaybe<Scalars['Byte']['input']>>>;
  readonly nlt?: InputMaybe<Scalars['Byte']['input']>;
  readonly nlte?: InputMaybe<Scalars['Byte']['input']>;
};

/** Player Careers */
export type Career =
  /** Archmage */
  | 'ARCHMAGE'
  /** Black Guard */
  | 'BLACK_GUARD'
  /** Black Orc */
  | 'BLACK_ORC'
  /** Bright Wizard */
  | 'BRIGHT_WIZARD'
  /** Choppa */
  | 'CHOPPA'
  /** Chosen */
  | 'CHOSEN'
  /** Disciple of Khaine */
  | 'DISCIPLE_OF_KHAINE'
  /** Engineer */
  | 'ENGINEER'
  /** Iron Breaker */
  | 'IRON_BREAKER'
  /** Knight of the Blazing Sun */
  | 'KNIGHT_OF_THE_BLAZING_SUN'
  /** Magus */
  | 'MAGUS'
  /** Marauder */
  | 'MARAUDER'
  /** Rune Priest */
  | 'RUNE_PRIEST'
  /** Shadow Warrior */
  | 'SHADOW_WARRIOR'
  /** Shaman */
  | 'SHAMAN'
  /** Slayer */
  | 'SLAYER'
  /** Sorceress */
  | 'SORCERER'
  /** Squig Herder */
  | 'SQUIG_HERDER'
  /** Sword Master */
  | 'SWORD_MASTER'
  /** Warrior Priest */
  | 'WARRIOR_PRIEST'
  /** White Lion */
  | 'WHITE_LION'
  /** Witch Elf */
  | 'WITCH_ELF'
  /** Witch Hunter */
  | 'WITCH_HUNTER'
  /** Zealot */
  | 'ZEALOT';

export type CareerLineOperationFilterInput = {
  readonly eq?: InputMaybe<Career>;
  readonly in?: InputMaybe<ReadonlyArray<Career>>;
  readonly neq?: InputMaybe<Career>;
  readonly nin?: InputMaybe<ReadonlyArray<Career>>;
};

export type CareerMask =
  | 'ARCHMAGE'
  | 'BLACKGUARD'
  | 'BLACK_ORC'
  | 'BRIGHT_WIZARD'
  | 'CHOPPA'
  | 'CHOSEN'
  | 'DISCIPLE_OF_KHAINE'
  | 'ENGINEER'
  | 'IRONBREAKER'
  | 'KNIGHT'
  | 'MAGUS'
  | 'MARAUDER'
  | 'RUNE_PRIEST'
  | 'SHADOW_WARRIOR'
  | 'SHAMAN'
  | 'SLAYER'
  | 'SORCERER'
  | 'SQUIG_HERDER'
  | 'SWORD_MASTER'
  | 'WARRIOR_PRIEST'
  | 'WHITE_LION'
  | 'WITCH_ELF'
  | 'WITCH_HUNTER'
  | 'ZEALOT';

export type CareerMaskFlagsInput = {
  readonly isArchmage?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isBlackOrc?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isBlackguard?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isBrightWizard?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isChoppa?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isChosen?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isDiscipleOfKhaine?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isEngineer?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isIronbreaker?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isKnight?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isMagus?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isMarauder?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isRunePriest?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isShadowWarrior?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isShaman?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isSlayer?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isSorcerer?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isSquigHerder?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isSwordMaster?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isWarriorPriest?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isWhiteLion?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isWitchElf?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isWitchHunter?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isZealot?: InputMaybe<Scalars['Boolean']['input']>;
};

export type CareerMaskOperationFilterInput = {
  readonly eq?: InputMaybe<CareerMaskFlagsInput>;
  readonly in?: InputMaybe<ReadonlyArray<CareerMaskFlagsInput>>;
  readonly neq?: InputMaybe<CareerMaskFlagsInput>;
  readonly nin?: InputMaybe<ReadonlyArray<CareerMaskFlagsInput>>;
};

export type Chapter = SearchContent & {
  readonly __typename?: 'Chapter';
  readonly id: Scalars['ID']['output'];
  readonly influenceRewards: ReadonlyArray<ChapterInfluenceReward>;
  readonly name?: Maybe<Scalars['String']['output']>;
  readonly position: Position;
  readonly rank: Scalars['UnsignedInt']['output'];
};

export type ChapterFilterInput = {
  readonly and?: InputMaybe<ReadonlyArray<ChapterFilterInput>>;
  /** Name */
  readonly name?: InputMaybe<StringOperationFilterInput>;
  readonly or?: InputMaybe<ReadonlyArray<ChapterFilterInput>>;
  /** Zone */
  readonly rank?: InputMaybe<UnsignedIntOperationFilterInputType>;
  /** Zone */
  readonly zoneId?: InputMaybe<UnsignedShortOperationFilterInputType>;
};

export type ChapterInfluenceReward = {
  readonly __typename?: 'ChapterInfluenceReward';
  readonly count: Scalars['UnsignedShort']['output'];
  readonly item: Item;
  readonly realm: Realm;
  readonly tier: Scalars['Byte']['output'];
};

export type ChapterSortInput = {
  readonly id?: InputMaybe<SortEnumType>;
  readonly name?: InputMaybe<SortEnumType>;
  readonly rank?: InputMaybe<SortEnumType>;
};

/** A connection to a list of items. */
export type ChaptersConnection = {
  readonly __typename?: 'ChaptersConnection';
  /** A list of edges. */
  readonly edges?: Maybe<ReadonlyArray<ChaptersEdge>>;
  /** A flattened list of the nodes. */
  readonly nodes?: Maybe<ReadonlyArray<Chapter>>;
  /** Information to aid in pagination. */
  readonly pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  readonly totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type ChaptersEdge = {
  readonly __typename?: 'ChaptersEdge';
  /** A cursor for use in pagination. */
  readonly cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  readonly node: Chapter;
};

/** Info about a character */
export type Character = SearchContent & {
  readonly __typename?: 'Character';
  /** Career/Class of the character */
  readonly career: Career;
  /** Current Guild membership */
  readonly guildMembership?: Maybe<GuildMember>;
  /** Character Id */
  readonly id: Scalars['ID']['output'];
  /** Items equipped by the character */
  readonly items: ReadonlyArray<CharacterItem>;
  /** Current Level */
  readonly level: Scalars['Byte']['output'];
  /** First name */
  readonly name: Scalars['String']['output'];
  /** Scenario ratings for the character */
  readonly ratings: ReadonlyArray<CharacterRating>;
  /** Current Renown Rank */
  readonly renownRank: Scalars['Byte']['output'];
};

export type CharacterFilterInput = {
  readonly and?: InputMaybe<ReadonlyArray<CharacterFilterInput>>;
  /** Character career */
  readonly careerLine?: InputMaybe<CareerLineOperationFilterInput>;
  /** Character level */
  readonly level?: InputMaybe<ByteOperationFilterInput>;
  /** Character name */
  readonly name?: InputMaybe<StringOperationFilterInput>;
  readonly or?: InputMaybe<ReadonlyArray<CharacterFilterInput>>;
  /** Character renown rank */
  readonly renownRank?: InputMaybe<ByteOperationFilterInput>;
};

export type CharacterItem = {
  readonly __typename?: 'CharacterItem';
  /** Slot where the item is equipped */
  readonly equipSlot: EquipSlot;
  /** Item info */
  readonly item: Item;
  readonly talismans: ReadonlyArray<Item>;
};

/** Info about a quest objective */
export type CharacterRating = {
  readonly __typename?: 'CharacterRating';
  /** Character information */
  readonly character: Character;
  /** Mu */
  readonly mu: Scalars['Float']['output'];
  readonly rating: Scalars['Float']['output'];
  /** Rating type */
  readonly ratingType: RatingType;
  /** Season ID */
  readonly seasonId: Scalars['ID']['output'];
  /** Sigma */
  readonly sigma: Scalars['Float']['output'];
};

export type CharacterRatingFilterInput = {
  readonly and?: InputMaybe<ReadonlyArray<CharacterRatingFilterInput>>;
  readonly characterId?: InputMaybe<UnsignedIntOperationFilterInputType>;
  readonly mu?: InputMaybe<FloatOperationFilterInput>;
  readonly or?: InputMaybe<ReadonlyArray<CharacterRatingFilterInput>>;
  readonly ratingType?: InputMaybe<RatingTypeOperationFilterInput>;
  readonly seasonId?: InputMaybe<UnsignedShortOperationFilterInputType>;
  readonly sigma?: InputMaybe<FloatOperationFilterInput>;
};

export type CharacterRatingSortInput = {
  readonly mu?: InputMaybe<SortEnumType>;
  readonly sigma?: InputMaybe<SortEnumType>;
};

/** A connection to a list of items. */
export type CharacterRatingsConnection = {
  readonly __typename?: 'CharacterRatingsConnection';
  /** A list of edges. */
  readonly edges?: Maybe<ReadonlyArray<CharacterRatingsEdge>>;
  /** A flattened list of the nodes. */
  readonly nodes?: Maybe<ReadonlyArray<CharacterRating>>;
  /** Information to aid in pagination. */
  readonly pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  readonly totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type CharacterRatingsEdge = {
  readonly __typename?: 'CharacterRatingsEdge';
  /** A cursor for use in pagination. */
  readonly cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  readonly node: CharacterRating;
};

export type CharacterSeasonStatsFilterInput = {
  readonly and?: InputMaybe<ReadonlyArray<CharacterSeasonStatsFilterInput>>;
  readonly or?: InputMaybe<ReadonlyArray<CharacterSeasonStatsFilterInput>>;
};

export type CharacterSortInput = {
  readonly level?: InputMaybe<SortEnumType>;
  readonly name?: InputMaybe<SortEnumType>;
  readonly renownRank?: InputMaybe<SortEnumType>;
};

export type CharacterStatsInput = {
  /** BallisticSkill */
  readonly ballisticSkill: Scalars['Int']['input'];
  /** Intelligence */
  readonly intelligence: Scalars['Int']['input'];
  /** Ability Level */
  readonly level: Scalars['Byte']['input'];
  /** Strength */
  readonly strength: Scalars['Int']['input'];
  /** Willpower */
  readonly willpower: Scalars['Int']['input'];
};

/** A connection to a list of items. */
export type CharactersConnection = {
  readonly __typename?: 'CharactersConnection';
  /** A list of edges. */
  readonly edges?: Maybe<ReadonlyArray<CharactersEdge>>;
  /** A flattened list of the nodes. */
  readonly nodes?: Maybe<ReadonlyArray<Character>>;
  /** Information to aid in pagination. */
  readonly pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  readonly totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type CharactersEdge = {
  readonly __typename?: 'CharactersEdge';
  /** A cursor for use in pagination. */
  readonly cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  readonly node: Character;
};

export type CitySiegeEvent = Event & {
  readonly __typename?: 'CitySiegeEvent';
  readonly endTime?: Maybe<Scalars['DateTime']['output']>;
  readonly name: Scalars['String']['output'];
  readonly startTime: Scalars['DateTime']['output'];
};

export type CraftingItemType =
  | 'CONTAINER'
  | 'CONTAINER_DYE'
  | 'CONTAINER_ESSENCE'
  | 'CURIO'
  | 'EXTENDER'
  | 'FIXER'
  | 'FRAGMENT'
  | 'GOLDDUST'
  | 'GOLDWEED'
  | 'GOLD_ESSENCE'
  | 'MAGIC_ESSENCE'
  | 'MAIN_INGREDIENT'
  | 'MULTIPLIER'
  | 'PIGMENT'
  | 'QUICKSILVER'
  | 'STABILIZER'
  | 'STIMULANT'
  | 'TALISMAN_CONTAINER';

export type Creature = SearchContent & {
  readonly __typename?: 'Creature';
  readonly creatureSubType: CreatureSubType;
  readonly creatureType: CreatureType;
  readonly id: Scalars['ID']['output'];
  readonly modelName: Scalars['String']['output'];
  readonly name: Scalars['String']['output'];
  readonly questsFinisher: ReadonlyArray<Quest>;
  readonly questsStarter: ReadonlyArray<Quest>;
  readonly realm?: Maybe<Realm>;
  readonly spawns: ReadonlyArray<CreatureSpawn>;
  /** Items sold by this creature */
  readonly vendorItems?: Maybe<VendorItemsConnection>;
};


export type CreatureVendorItemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type CreatureFilterInput = {
  readonly and?: InputMaybe<ReadonlyArray<CreatureFilterInput>>;
  /** Sub Type */
  readonly creatureSubType?: InputMaybe<CreatureSubTypesOperationFilterInput>;
  /** Type */
  readonly creatureType?: InputMaybe<CreatureTypesOperationFilterInput>;
  /** Name */
  readonly name?: InputMaybe<StringOperationFilterInput>;
  readonly or?: InputMaybe<ReadonlyArray<CreatureFilterInput>>;
};

export type CreatureSortInput = {
  readonly creatureSubType?: InputMaybe<SortEnumType>;
  readonly creatureType?: InputMaybe<SortEnumType>;
  readonly id?: InputMaybe<SortEnumType>;
  readonly name?: InputMaybe<SortEnumType>;
};

export type CreatureSpawn = {
  readonly __typename?: 'CreatureSpawn';
  readonly id: Scalars['ID']['output'];
  /** Position Info */
  readonly position: Position;
  /** Zone Info */
  readonly zone: Zone;
};

export type CreatureSubType =
  | 'ANIMALS_BEASTS_BASILISK'
  | 'ANIMALS_BEASTS_BEAR'
  | 'ANIMALS_BEASTS_BOAR'
  | 'ANIMALS_BEASTS_GIANT_BAT'
  | 'ANIMALS_BEASTS_GREAT_CAT'
  | 'ANIMALS_BEASTS_HOUND'
  | 'ANIMALS_BEASTS_RHINOX'
  | 'ANIMALS_BEASTS_WOLF'
  | 'ANIMALS_BIRDS_GREAT_EAGLE'
  | 'ANIMALS_BIRDS_VULTURE'
  | 'ANIMALS_BIRDS_WARHAWK'
  | 'ANIMALS_CRITTER_BAT'
  | 'ANIMALS_CRITTER_BIRD'
  | 'ANIMALS_CRITTER_CRAB'
  | 'ANIMALS_CRITTER_DEER'
  | 'ANIMALS_CRITTER_HARE'
  | 'ANIMALS_CRITTER_LIZARD'
  | 'ANIMALS_CRITTER_MAGGOT'
  | 'ANIMALS_CRITTER_RAT'
  | 'ANIMALS_CRITTER_SPIDER'
  | 'ANIMALS_INSECTS_ARACHNIDS_GIANT_SCARAB'
  | 'ANIMALS_INSECTS_ARACHNIDS_GIANT_SCORPION'
  | 'ANIMALS_INSECTS_ARACHNIDS_GIANT_SPIDER'
  | 'ANIMALS_INSECTS_ARACHNIDS_TOMB_SWARM'
  | 'ANIMALS_LIVESTOCK_CAT'
  | 'ANIMALS_LIVESTOCK_CHICKEN'
  | 'ANIMALS_LIVESTOCK_COW'
  | 'ANIMALS_LIVESTOCK_DOG'
  | 'ANIMALS_LIVESTOCK_HORSE'
  | 'ANIMALS_LIVESTOCK_PIG'
  | 'ANIMALS_LIVESTOCK_SHEEP'
  | 'ANIMALS_REPTILES_COLD_ONE'
  | 'ANIMALS_REPTILES_GIANT_LIZARD'
  | 'DAEMONS_KHORNE_BLOODBEAST'
  | 'DAEMONS_KHORNE_BLOODLETTER'
  | 'DAEMONS_KHORNE_BLOODTHIRSTER'
  | 'DAEMONS_KHORNE_FLESH_HOUND'
  | 'DAEMONS_KHORNE_JUGGERNAUT_OF_KHORNE'
  | 'DAEMONS_NURGLE_GREAT_UNCLEAN_ONE'
  | 'DAEMONS_NURGLE_NURGLING'
  | 'DAEMONS_NURGLE_PLAGUEBEARER'
  | 'DAEMONS_NURGLE_PLAGUEBEAST'
  | 'DAEMONS_NURGLE_SLIME_HOUND'
  | 'DAEMONS_SLAANESH_DAEMONETTE'
  | 'DAEMONS_SLAANESH_FIEND'
  | 'DAEMONS_SLAANESH_KEEPER_OF_SECRETS'
  | 'DAEMONS_TZEENTCH_FIREWYRM'
  | 'DAEMONS_TZEENTCH_FLAMER'
  | 'DAEMONS_TZEENTCH_HORROR'
  | 'DAEMONS_TZEENTCH_LORD_OF_CHANGE'
  | 'DAEMONS_TZEENTCH_SCREAMER'
  | 'DAEMONS_TZEENTCH_WATCHER'
  | 'DAEMONS_UNMARKED_DAEMONS_CHAOS_FURY'
  | 'DAEMONS_UNMARKED_DAEMONS_CHAOS_HOUND'
  | 'DAEMONS_UNMARKED_DAEMONS_CHAOS_SPAWN'
  | 'DAEMONS_UNMARKED_DAEMONS_DAEMONVINE'
  | 'DAEMONS_UNMARKED_DAEMONS_DAEMON_PRINCE'
  | 'DAEMONS_UNMARKED_DAEMONS_WALKER'
  | 'DWARVEN_SLAYER'
  | 'HUMANOIDS_BEASTMEN_BESTIGOR'
  | 'HUMANOIDS_BEASTMEN_BRAY_SHAMAN'
  | 'HUMANOIDS_BEASTMEN_DOOMBULL'
  | 'HUMANOIDS_BEASTMEN_GOR'
  | 'HUMANOIDS_BEASTMEN_UNGOR'
  | 'HUMANOIDS_DARK_ELVES_BLACK_GUARD'
  | 'HUMANOIDS_DARK_ELVES_DARK_ELF'
  | 'HUMANOIDS_DARK_ELVES_DISCIPLE_OF_KHAINE'
  | 'HUMANOIDS_DARK_ELVES_SORCERESS'
  | 'HUMANOIDS_DARK_ELVES_WITCH_ELVES'
  | 'HUMANOIDS_DWARFS_DWARF'
  | 'HUMANOIDS_DWARFS_ENGINEER'
  | 'HUMANOIDS_DWARFS_HAMMERER'
  | 'HUMANOIDS_DWARFS_IRONBREAKER'
  | 'HUMANOIDS_DWARFS_RUNEPRIEST'
  | 'HUMANOIDS_DWARFS_SLAYER'
  | 'HUMANOIDS_ELVES_ARCHMAGE'
  | 'HUMANOIDS_ELVES_HIGH_ELF'
  | 'HUMANOIDS_ELVES_SHADOW_WARRIOR'
  | 'HUMANOIDS_ELVES_SWORDMASTER'
  | 'HUMANOIDS_ELVES_WHITE_LION'
  | 'HUMANOIDS_GREENSKINS_BLACK_ORC'
  | 'HUMANOIDS_GREENSKINS_CHOPPA'
  | 'HUMANOIDS_GREENSKINS_GNOBLAR'
  | 'HUMANOIDS_GREENSKINS_GOBLIN'
  | 'HUMANOIDS_GREENSKINS_NIGHT_GOBLIN'
  | 'HUMANOIDS_GREENSKINS_ORC'
  | 'HUMANOIDS_GREENSKINS_SAVAGE_ORC'
  | 'HUMANOIDS_GREENSKINS_SHAMAN'
  | 'HUMANOIDS_GREENSKINS_SNOTLING'
  | 'HUMANOIDS_GREENSKINS_SQUIG'
  | 'HUMANOIDS_GREENSKINS_SQUIG_HERDER'
  | 'HUMANOIDS_HUMANS_BANDIT'
  | 'HUMANOIDS_HUMANS_BRIGHT_WIZARD'
  | 'HUMANOIDS_HUMANS_CHAOS'
  | 'HUMANOIDS_HUMANS_CHOSEN'
  | 'HUMANOIDS_HUMANS_DRAKK_CULTIST'
  | 'HUMANOIDS_HUMANS_EMPIRE'
  | 'HUMANOIDS_HUMANS_GHOUL'
  | 'HUMANOIDS_HUMANS_HUMAN'
  | 'HUMANOIDS_HUMANS_KNIGHT_OF_THE_BLAZING_SUN'
  | 'HUMANOIDS_HUMANS_MAGUS'
  | 'HUMANOIDS_HUMANS_MARAUDER'
  | 'HUMANOIDS_HUMANS_PLAGUE_VICTIM'
  | 'HUMANOIDS_HUMANS_WARRIOR_PRIEST'
  | 'HUMANOIDS_HUMANS_WITCH_HUNTER'
  | 'HUMANOIDS_HUMANS_ZEALOT'
  | 'HUMANOIDS_OGRES_GORGER'
  | 'HUMANOIDS_OGRES_OGRE'
  | 'HUMANOIDS_OGRES_OGRE_BULL'
  | 'HUMANOIDS_OGRES_OGRE_TYRANT'
  | 'HUMANOIDS_OGRES_YHETEE'
  | 'HUMANOIDS_SKAVEN_RAT_OGRE'
  | 'HUMANOIDS_SKAVEN_SKAVEN'
  | 'MONSTERS_CHAOS_BREEDS_CENTIGOR'
  | 'MONSTERS_CHAOS_BREEDS_CHAOS_MUTANT'
  | 'MONSTERS_CHAOS_BREEDS_DRAGON_OGRE'
  | 'MONSTERS_CHAOS_BREEDS_FLAYERKIN'
  | 'MONSTERS_CHAOS_BREEDS_HARPY'
  | 'MONSTERS_CHAOS_BREEDS_MAGGOT'
  | 'MONSTERS_CHAOS_BREEDS_MINOTAUR'
  | 'MONSTERS_CHAOS_BREEDS_TUSKGOR'
  | 'MONSTERS_DRAGONOIDS_HYDRA'
  | 'MONSTERS_DRAGONOIDS_WYVERN'
  | 'MONSTERS_DRAGONOID_DRAGON'
  | 'MONSTERS_GIANTS_CHAOS_GIANT'
  | 'MONSTERS_GIANTS_GIANT'
  | 'MONSTERS_MAGICAL_BEASTS_COCKATRICE'
  | 'MONSTERS_MAGICAL_BEASTS_GRIFFON'
  | 'MONSTERS_MAGICAL_BEASTS_IMP'
  | 'MONSTERS_MAGICAL_BEASTS_MANTICORE'
  | 'MONSTERS_MAGICAL_BEASTS_PEGASUS'
  | 'MONSTERS_MAGICAL_BEASTS_UNICORN'
  | 'MONSTERS_TROLLS_CHAOS_TROLL'
  | 'MONSTERS_TROLLS_RIVER_TROLL'
  | 'MONSTERS_TROLLS_STONE_TROLL'
  | 'MONSTERS_TROLLS_TROLL'
  | 'PLANTS_FOREST_SPIRITS_DRYAD'
  | 'PLANTS_FOREST_SPIRITS_KURNOUS'
  | 'PLANTS_FOREST_SPIRITS_SPITE'
  | 'PLANTS_FOREST_SPIRITS_TREEKIN'
  | 'PLANTS_FOREST_SPIRITS_TREEMAN'
  | 'SIEGE_CATAPULT'
  | 'SIEGE_GTAOE'
  | 'SIEGE_OIL'
  | 'SIEGE_RAM'
  | 'SIEGE_SINGLE_TARGET'
  | 'UNCLASSIFIED'
  | 'UNDEAD_CONSTRUCTS_ASP_BONE_CONSTRUCT'
  | 'UNDEAD_CONSTRUCTS_BONE_GIANT'
  | 'UNDEAD_CONSTRUCTS_CONSTRUCT'
  | 'UNDEAD_CONSTRUCTS_LIVING_ARMOR'
  | 'UNDEAD_CONSTRUCTS_SCARAB_BONE_CONSTRUCT'
  | 'UNDEAD_CONSTRUCTS_TOMB_SCORPION'
  | 'UNDEAD_CONSTRUCTS_USHABTI'
  | 'UNDEAD_CONSTRUCTS_WINGED_NIGHTMARE'
  | 'UNDEAD_GREATER_UNDEAD_LICHE'
  | 'UNDEAD_GREATER_UNDEAD_PRESERVED_DEAD'
  | 'UNDEAD_GREATER_UNDEAD_VAMPIRE'
  | 'UNDEAD_SKELETONS_CARRION'
  | 'UNDEAD_SKELETONS_SKELETON'
  | 'UNDEAD_SPIRITS_BANSHEE'
  | 'UNDEAD_SPIRITS_SPIRIT_HOST'
  | 'UNDEAD_SPIRITS_WRAITH'
  | 'UNDEAD_WIGHTS_WIGHT'
  | 'UNDEAD_ZOMBIES_ZOMBIE';

export type CreatureSubTypesOperationFilterInput = {
  readonly eq?: InputMaybe<CreatureSubType>;
  readonly in?: InputMaybe<ReadonlyArray<CreatureSubType>>;
  readonly neq?: InputMaybe<CreatureSubType>;
  readonly nin?: InputMaybe<ReadonlyArray<CreatureSubType>>;
};

export type CreatureType =
  | 'ANIMALS_BEASTS'
  | 'ANIMALS_BIRDS'
  | 'ANIMALS_CRITTER'
  | 'ANIMALS_INSECTS_ARACHNIDS'
  | 'ANIMALS_LIVESTOCK'
  | 'ANIMALS_REPTILES'
  | 'DAEMONS_KHORNE'
  | 'DAEMONS_NURGLE'
  | 'DAEMONS_SLAANESH'
  | 'DAEMONS_TZEENTCH'
  | 'DAEMONS_UNMARKED'
  | 'HUMANOIDS_BEASTMEN'
  | 'HUMANOIDS_DARK_ELVES'
  | 'HUMANOIDS_DWARFS'
  | 'HUMANOIDS_ELVES'
  | 'HUMANOIDS_GREENSKINS'
  | 'HUMANOIDS_HUMANS'
  | 'HUMANOIDS_OGRES'
  | 'HUMANOIDS_SKAVEN'
  | 'MONSTERS_CHAOS_BREEDS'
  | 'MONSTERS_DRAGONOIDS'
  | 'MONSTERS_GIANTS'
  | 'MONSTERS_MAGICAL_BEASTS'
  | 'MONSTERS_TROLLS'
  | 'PLANTS_FOREST_SPIRITS'
  | 'SIEGE'
  | 'UNCLASSIFIED'
  | 'UNDEAD_CONSTRUCTS'
  | 'UNDEAD_GREATER_UNDEAD'
  | 'UNDEAD_SKELETONS'
  | 'UNDEAD_SPIRITS'
  | 'UNDEAD_WIGHTS'
  | 'UNDEAD_ZOMBIES';

export type CreatureTypesOperationFilterInput = {
  readonly eq?: InputMaybe<CreatureType>;
  readonly in?: InputMaybe<ReadonlyArray<CreatureType>>;
  readonly neq?: InputMaybe<CreatureType>;
  readonly nin?: InputMaybe<ReadonlyArray<CreatureType>>;
};

/** A connection to a list of items. */
export type CreaturesConnection = {
  readonly __typename?: 'CreaturesConnection';
  /** A list of edges. */
  readonly edges?: Maybe<ReadonlyArray<CreaturesEdge>>;
  /** A flattened list of the nodes. */
  readonly nodes?: Maybe<ReadonlyArray<Creature>>;
  /** Information to aid in pagination. */
  readonly pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  readonly totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type CreaturesEdge = {
  readonly __typename?: 'CreaturesEdge';
  /** A cursor for use in pagination. */
  readonly cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  readonly node: Creature;
};

/** A connection to a list of items. */
export type DropsFromCreaturesConnection = {
  readonly __typename?: 'DropsFromCreaturesConnection';
  /** A list of edges. */
  readonly edges?: Maybe<ReadonlyArray<DropsFromCreaturesEdge>>;
  /** A flattened list of the nodes. */
  readonly nodes?: Maybe<ReadonlyArray<Creature>>;
  /** Information to aid in pagination. */
  readonly pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  readonly totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type DropsFromCreaturesEdge = {
  readonly __typename?: 'DropsFromCreaturesEdge';
  /** A cursor for use in pagination. */
  readonly cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  readonly node: Creature;
};

/** A connection to a list of items. */
export type DropsFromGameObjectsConnection = {
  readonly __typename?: 'DropsFromGameObjectsConnection';
  /** A list of edges. */
  readonly edges?: Maybe<ReadonlyArray<DropsFromGameObjectsEdge>>;
  /** A flattened list of the nodes. */
  readonly nodes?: Maybe<ReadonlyArray<GameObject>>;
  /** Information to aid in pagination. */
  readonly pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  readonly totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type DropsFromGameObjectsEdge = {
  readonly __typename?: 'DropsFromGameObjectsEdge';
  /** A cursor for use in pagination. */
  readonly cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  readonly node: GameObject;
};

/** Character equipment slots */
export type EquipSlot =
  | 'BACK'
  | 'BELT'
  | 'BODY'
  | 'BOOTS'
  | 'EITHER_HAND'
  | 'EVENT'
  | 'GLOVES'
  | 'HELM'
  | 'JEWELLERY1'
  | 'JEWELLERY2'
  | 'JEWELLERY3'
  | 'JEWELLERY4'
  | 'MAIN_HAND'
  | 'NONE'
  | 'OFF_HAND'
  | 'POCKET1'
  | 'POCKET2'
  | 'RANGED_WEAPON'
  | 'SHOULDER'
  | 'STANDARD'
  | 'TROPHY1'
  | 'TROPHY2'
  | 'TROPHY3'
  | 'TROPHY4'
  | 'TROPHY5';

export type EquipSlotOperationFilterInput = {
  readonly eq?: InputMaybe<EquipSlot>;
  readonly in?: InputMaybe<ReadonlyArray<EquipSlot>>;
  readonly neq?: InputMaybe<EquipSlot>;
  readonly nin?: InputMaybe<ReadonlyArray<EquipSlot>>;
};

export type Event = {
  readonly endTime?: Maybe<Scalars['DateTime']['output']>;
  readonly name: Scalars['String']['output'];
  readonly startTime: Scalars['DateTime']['output'];
};

export type FloatOperationFilterInput = {
  readonly eq?: InputMaybe<Scalars['Float']['input']>;
  readonly gt?: InputMaybe<Scalars['Float']['input']>;
  readonly gte?: InputMaybe<Scalars['Float']['input']>;
  readonly in?: InputMaybe<ReadonlyArray<InputMaybe<Scalars['Float']['input']>>>;
  readonly lt?: InputMaybe<Scalars['Float']['input']>;
  readonly lte?: InputMaybe<Scalars['Float']['input']>;
  readonly neq?: InputMaybe<Scalars['Float']['input']>;
  readonly ngt?: InputMaybe<Scalars['Float']['input']>;
  readonly ngte?: InputMaybe<Scalars['Float']['input']>;
  readonly nin?: InputMaybe<ReadonlyArray<InputMaybe<Scalars['Float']['input']>>>;
  readonly nlt?: InputMaybe<Scalars['Float']['input']>;
  readonly nlte?: InputMaybe<Scalars['Float']['input']>;
};

export type GameObject = {
  readonly __typename?: 'GameObject';
  readonly id: Scalars['ID']['output'];
  readonly modelName?: Maybe<Scalars['String']['output']>;
  /** The name of the Game Object */
  readonly name: Scalars['String']['output'];
  readonly questsFinisher: ReadonlyArray<Quest>;
  readonly questsStarter: ReadonlyArray<Quest>;
  readonly spawns: ReadonlyArray<GameObjectSpawn>;
};

export type GameObjectProtoFilterInput = {
  readonly and?: InputMaybe<ReadonlyArray<GameObjectProtoFilterInput>>;
  /** Name */
  readonly name?: InputMaybe<StringOperationFilterInput>;
  readonly or?: InputMaybe<ReadonlyArray<GameObjectProtoFilterInput>>;
};

export type GameObjectProtoSortInput = {
  readonly id?: InputMaybe<SortEnumType>;
  readonly name?: InputMaybe<SortEnumType>;
};

export type GameObjectSpawn = {
  readonly __typename?: 'GameObjectSpawn';
  readonly id: Scalars['ID']['output'];
  /** Position Info */
  readonly position: Position;
  /** Zone Info */
  readonly zone: Zone;
};

/** A connection to a list of items. */
export type GameObjectsConnection = {
  readonly __typename?: 'GameObjectsConnection';
  /** A list of edges. */
  readonly edges?: Maybe<ReadonlyArray<GameObjectsEdge>>;
  /** A flattened list of the nodes. */
  readonly nodes?: Maybe<ReadonlyArray<GameObject>>;
  /** Information to aid in pagination. */
  readonly pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  readonly totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type GameObjectsEdge = {
  readonly __typename?: 'GameObjectsEdge';
  /** A cursor for use in pagination. */
  readonly cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  readonly node: GameObject;
};

export type Guild = SearchContent & {
  readonly __typename?: 'Guild';
  /** Recruiting brief description */
  readonly briefDescription: Scalars['String']['output'];
  /** Recruiting description */
  readonly description: Scalars['String']['output'];
  /** Guild heraldry */
  readonly heraldry: GuildHeraldry;
  /** Guild Id */
  readonly id: Scalars['ID']['output'];
  /** Guild leader */
  readonly leader?: Maybe<Character>;
  /** Guild level */
  readonly level: Scalars['Byte']['output'];
  /** Guild members */
  readonly members?: Maybe<MembersConnection>;
  /** Guild name */
  readonly name: Scalars['String']['output'];
  /** Guild ranks */
  readonly ranks: ReadonlyArray<GuildRank>;
  /** Guild realm */
  readonly realm: Realm;
};


export type GuildMembersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type GuildFeudFilterInput = {
  readonly guild1Id: Scalars['ID']['input'];
  readonly guild2Id: Scalars['ID']['input'];
};

export type GuildFilterInput = {
  readonly and?: InputMaybe<ReadonlyArray<GuildFilterInput>>;
  /** Guild level */
  readonly level?: InputMaybe<ByteOperationFilterInput>;
  /** Guild name */
  readonly name?: InputMaybe<StringOperationFilterInput>;
  readonly or?: InputMaybe<ReadonlyArray<GuildFilterInput>>;
  /** Guild realm */
  readonly realm?: InputMaybe<RealmsOperationFilterInput>;
};

export type GuildHeraldry = {
  readonly __typename?: 'GuildHeraldry';
  /** Primary Color */
  readonly color1: Scalars['Int']['output'];
  /** Secondary Color */
  readonly color2: Scalars['Int']['output'];
  /** Emblem */
  readonly emblem: Scalars['Int']['output'];
  /** Pattern */
  readonly pattern: Scalars['Int']['output'];
  /** Shape */
  readonly shape: Scalars['Int']['output'];
};

export type GuildInfoSortInput = {
  readonly level?: InputMaybe<SortEnumType>;
  readonly name?: InputMaybe<SortEnumType>;
};

export type GuildMember = {
  readonly __typename?: 'GuildMember';
  /** Character info */
  readonly character: Character;
  /** Guild */
  readonly guild: Guild;
  /** Guild rank */
  readonly rank: GuildRank;
};

export type GuildRank = {
  readonly __typename?: 'GuildRank';
  /** Rank name */
  readonly name: Scalars['String']['output'];
  /** Rank id */
  readonly rank: Scalars['Byte']['output'];
};

/** A connection to a list of items. */
export type GuildsConnection = {
  readonly __typename?: 'GuildsConnection';
  /** A list of edges. */
  readonly edges?: Maybe<ReadonlyArray<GuildsEdge>>;
  /** A flattened list of the nodes. */
  readonly nodes?: Maybe<ReadonlyArray<Guild>>;
  /** Information to aid in pagination. */
  readonly pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  readonly totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type GuildsEdge = {
  readonly __typename?: 'GuildsEdge';
  /** A cursor for use in pagination. */
  readonly cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  readonly node: Guild;
};

export type Icon = {
  readonly __typename?: 'Icon';
  /** Icon Id */
  readonly id: Scalars['ID']['output'];
  /** Name */
  readonly name: Scalars['String']['output'];
  /** URL to image file */
  readonly url?: Maybe<Scalars['String']['output']>;
};

export type Instance = {
  readonly __typename?: 'Instance';
  /** Encounters */
  readonly encounters?: Maybe<ReadonlyArray<Maybe<InstanceEncounter>>>;
  /** Id */
  readonly id: Scalars['ID']['output'];
  /** Name */
  readonly name: Scalars['String']['output'];
  /** Zone information */
  readonly zone: Zone;
};

export type InstanceEncounter = {
  readonly __typename?: 'InstanceEncounter';
  /** Id */
  readonly id: Scalars['ID']['output'];
  /** Name */
  readonly name: Scalars['String']['output'];
};

export type InstanceEncounterRun = {
  readonly __typename?: 'InstanceEncounterRun';
  /** If the encounter was completed */
  readonly completed: Scalars['Boolean']['output'];
  /** Total deaths during the run */
  readonly deaths: Scalars['Int']['output'];
  /** Duration of the run in seconds */
  readonly duration: Scalars['Int']['output'];
  /** Encounter info */
  readonly encounter?: Maybe<InstanceEncounter>;
  /** The Id of the encounter */
  readonly encounterId: Scalars['ID']['output'];
  /** End time of the run */
  readonly end: Scalars['Long']['output'];
  /** The unique id of the run */
  readonly id: Scalars['ID']['output'];
  /** Instance information */
  readonly instance: Instance;
  /** The Id of the instance */
  readonly instanceId: Scalars['ID']['output'];
  /** The Id of the instance run */
  readonly instanceRunId: Scalars['ID']['output'];
  /** Scoreboard entries */
  readonly scoreboardEntries: ReadonlyArray<InstanceEncounterRunScoreboardEntry>;
  /** Start time of the run */
  readonly start: Scalars['Long']['output'];
};

export type InstanceEncounterRunFilterInput = {
  readonly and?: InputMaybe<ReadonlyArray<InstanceEncounterRunFilterInput>>;
  readonly averageItemRating?: InputMaybe<FloatOperationFilterInput>;
  readonly completed?: InputMaybe<BooleanOperationFilterInput>;
  readonly encounterId?: InputMaybe<UnsignedIntOperationFilterInputType>;
  readonly end?: InputMaybe<LongOperationFilterInput>;
  readonly id?: InputMaybe<UnsignedLongOperationFilterInputType>;
  readonly instanceId?: InputMaybe<UnsignedShortOperationFilterInputType>;
  readonly maxItemRating?: InputMaybe<UnsignedIntOperationFilterInputType>;
  readonly minItemRating?: InputMaybe<UnsignedIntOperationFilterInputType>;
  readonly or?: InputMaybe<ReadonlyArray<InstanceEncounterRunFilterInput>>;
  readonly scoreboardEntryCount?: InputMaybe<IntOperationFilterInput>;
  readonly start?: InputMaybe<LongOperationFilterInput>;
  readonly totalDeaths?: InputMaybe<LongOperationFilterInput>;
};

export type InstanceEncounterRunScoreboardEntry = {
  readonly __typename?: 'InstanceEncounterRunScoreboardEntry';
  /** Archetype at the time of the run */
  readonly archetype: Archetype;
  /** Career at the time of the run */
  readonly career: Career;
  /** Character information */
  readonly character: Character;
  /** Damage */
  readonly damage: Scalars['UnsignedInt']['output'];
  /** Damage Received */
  readonly damageReceived: Scalars['UnsignedInt']['output'];
  /** Deaths */
  readonly deaths: Scalars['UnsignedInt']['output'];
  /** Guild at the time of the run */
  readonly guild?: Maybe<Guild>;
  /** Healing */
  readonly healing: Scalars['UnsignedInt']['output'];
  /** Healing of others */
  readonly healingOthers: Scalars['UnsignedInt']['output'];
  /** Healing of self */
  readonly healingReceived: Scalars['UnsignedInt']['output'];
  /** Healing of self */
  readonly healingSelf: Scalars['UnsignedInt']['output'];
  /** Total item rating */
  readonly itemRating: Scalars['UnsignedInt']['output'];
  /** Damage contributing to kills */
  readonly killDamage: Scalars['UnsignedInt']['output'];
  /** Level at the time of the run */
  readonly level: Scalars['Byte']['output'];
  /** Damage Prevented */
  readonly protection: Scalars['UnsignedInt']['output'];
  /** Protection of others */
  readonly protectionOthers: Scalars['UnsignedInt']['output'];
  /** Protection Received */
  readonly protectionReceived: Scalars['UnsignedInt']['output'];
  /** Protection of self */
  readonly protectionSelf: Scalars['UnsignedInt']['output'];
  /** Renown rank at the time of the run */
  readonly renownRank: Scalars['Byte']['output'];
  /** Resurrections */
  readonly resurrectionsDone: Scalars['UnsignedInt']['output'];
};

export type InstanceEncounterRunSortInput = {
  readonly end?: InputMaybe<SortEnumType>;
  readonly start?: InputMaybe<SortEnumType>;
};

/** A connection to a list of items. */
export type InstanceEncounterRunsConnection = {
  readonly __typename?: 'InstanceEncounterRunsConnection';
  /** Average deaths of all matching runs */
  readonly averageDeaths: Scalars['Float']['output'];
  /** Average duration of all matching runs */
  readonly averageDuration: Scalars['Float']['output'];
  /** Number of completed runs of all matching runs */
  readonly completedCount: Scalars['Int']['output'];
  /** A list of edges. */
  readonly edges?: Maybe<ReadonlyArray<InstanceEncounterRunsEdge>>;
  /** Max duration of all matching runs */
  readonly maxDuration: Scalars['Float']['output'];
  /** Median deaths of all matching runs */
  readonly medianDeaths: Scalars['Int']['output'];
  /** Median duration of all matching runs */
  readonly medianDuration: Scalars['Float']['output'];
  /** Min duration of all matching runs */
  readonly minDuration: Scalars['Float']['output'];
  /** A flattened list of the nodes. */
  readonly nodes?: Maybe<ReadonlyArray<InstanceEncounterRun>>;
  /** Information to aid in pagination. */
  readonly pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  readonly totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type InstanceEncounterRunsEdge = {
  readonly __typename?: 'InstanceEncounterRunsEdge';
  /** A cursor for use in pagination. */
  readonly cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  readonly node: InstanceEncounterRun;
};

export type InstanceFilterInput = {
  readonly and?: InputMaybe<ReadonlyArray<InstanceFilterInput>>;
  readonly id?: InputMaybe<UnsignedShortOperationFilterInputType>;
  readonly name?: InputMaybe<StringOperationFilterInput>;
  readonly or?: InputMaybe<ReadonlyArray<InstanceFilterInput>>;
};

export type InstanceRun = {
  readonly __typename?: 'InstanceRun';
  /** If all encounters have been completed */
  readonly completed: Scalars['Boolean']['output'];
  /** Total deaths during the run */
  readonly deaths: Scalars['Int']['output'];
  /** Duration of the run in seconds */
  readonly duration: Scalars['Int']['output'];
  /** Encounters */
  readonly encounters: ReadonlyArray<InstanceEncounterRun>;
  /** End time of the run */
  readonly end: Scalars['Long']['output'];
  /** The unique id of the run */
  readonly id: Scalars['ID']['output'];
  /** Instance information */
  readonly instance: Instance;
  /** The id of the instance */
  readonly instanceId: Scalars['ID']['output'];
  /** Scoreboard entries */
  readonly scoreboardEntries: ReadonlyArray<InstanceRunScoreboardEntry>;
  /** Start time of the run */
  readonly start: Scalars['Long']['output'];
  /** Zone information */
  readonly zone: Zone;
};

export type InstanceRunFilterInput = {
  readonly and?: InputMaybe<ReadonlyArray<InstanceRunFilterInput>>;
  readonly averageItemRating?: InputMaybe<FloatOperationFilterInput>;
  readonly completed?: InputMaybe<BooleanOperationFilterInput>;
  readonly completedEncounters?: InputMaybe<IntOperationFilterInput>;
  readonly end?: InputMaybe<LongOperationFilterInput>;
  readonly id?: InputMaybe<UuidOperationFilterInput>;
  readonly instanceId?: InputMaybe<UnsignedShortOperationFilterInputType>;
  readonly maxItemRating?: InputMaybe<UnsignedIntOperationFilterInputType>;
  readonly minItemRating?: InputMaybe<UnsignedIntOperationFilterInputType>;
  readonly or?: InputMaybe<ReadonlyArray<InstanceRunFilterInput>>;
  readonly scoreboardEntryCount?: InputMaybe<IntOperationFilterInput>;
  readonly start?: InputMaybe<LongOperationFilterInput>;
  readonly totalDeaths?: InputMaybe<LongOperationFilterInput>;
};

export type InstanceRunScoreboardEntry = {
  readonly __typename?: 'InstanceRunScoreboardEntry';
  /** Archetype at the time of the run */
  readonly archetype: Archetype;
  /** Career at the time of the run */
  readonly career: Career;
  /** Character information */
  readonly character: Character;
  /** Damage */
  readonly damage: Scalars['UnsignedInt']['output'];
  /** Damage Received */
  readonly damageReceived: Scalars['UnsignedInt']['output'];
  /** Deaths */
  readonly deaths: Scalars['UnsignedInt']['output'];
  /** Guild at the time of the run */
  readonly guild?: Maybe<Guild>;
  /** Healing */
  readonly healing: Scalars['UnsignedInt']['output'];
  /** Healing of others */
  readonly healingOthers: Scalars['UnsignedInt']['output'];
  /** Healing of self */
  readonly healingReceived: Scalars['UnsignedInt']['output'];
  /** Healing of self */
  readonly healingSelf: Scalars['UnsignedInt']['output'];
  /** Total item rating */
  readonly itemRating: Scalars['UnsignedInt']['output'];
  /** Damage contributing to kills */
  readonly killDamage: Scalars['UnsignedInt']['output'];
  /** Level at the time of the run */
  readonly level: Scalars['Byte']['output'];
  /** Damage Prevented */
  readonly protection: Scalars['UnsignedInt']['output'];
  /** Protection of others */
  readonly protectionOthers: Scalars['UnsignedInt']['output'];
  /** Protection Received */
  readonly protectionReceived: Scalars['UnsignedInt']['output'];
  /** Protection of self */
  readonly protectionSelf: Scalars['UnsignedInt']['output'];
  /** Renown rank at the time of the run */
  readonly renownRank: Scalars['Byte']['output'];
  /** Resurrections */
  readonly resurrectionsDone: Scalars['UnsignedInt']['output'];
};

export type InstanceRunSortInput = {
  readonly end?: InputMaybe<SortEnumType>;
  readonly start?: InputMaybe<SortEnumType>;
};

/** A connection to a list of items. */
export type InstanceRunsConnection = {
  readonly __typename?: 'InstanceRunsConnection';
  /** Average deaths of all matching runs */
  readonly averageDeaths: Scalars['Float']['output'];
  /** Average duration of all matching runs */
  readonly averageDuration: Scalars['Float']['output'];
  /** Number of completed runs of all matching runs */
  readonly completedCount: Scalars['Int']['output'];
  /** A list of edges. */
  readonly edges?: Maybe<ReadonlyArray<InstanceRunsEdge>>;
  /** Max duration of all matching runs */
  readonly maxDuration: Scalars['Float']['output'];
  /** Median deaths of all matching runs */
  readonly medianDeaths: Scalars['Int']['output'];
  /** Median duration of all matching runs */
  readonly medianDuration: Scalars['Float']['output'];
  /** Min duration of all matching runs */
  readonly minDuration: Scalars['Float']['output'];
  /** A flattened list of the nodes. */
  readonly nodes?: Maybe<ReadonlyArray<InstanceRun>>;
  /** Information to aid in pagination. */
  readonly pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  readonly totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type InstanceRunsEdge = {
  readonly __typename?: 'InstanceRunsEdge';
  /** A cursor for use in pagination. */
  readonly cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  readonly node: InstanceRun;
};

export type InstanceSortInput = {
  readonly id?: InputMaybe<SortEnumType>;
  readonly name?: InputMaybe<SortEnumType>;
};

/** A connection to a list of items. */
export type InstancesConnection = {
  readonly __typename?: 'InstancesConnection';
  /** A list of edges. */
  readonly edges?: Maybe<ReadonlyArray<InstancesEdge>>;
  /** A flattened list of the nodes. */
  readonly nodes?: Maybe<ReadonlyArray<Instance>>;
  /** Information to aid in pagination. */
  readonly pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  readonly totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type InstancesEdge = {
  readonly __typename?: 'InstancesEdge';
  /** A cursor for use in pagination. */
  readonly cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  readonly node: Instance;
};

export type IntOperationFilterInput = {
  readonly eq?: InputMaybe<Scalars['Int']['input']>;
  readonly gt?: InputMaybe<Scalars['Int']['input']>;
  readonly gte?: InputMaybe<Scalars['Int']['input']>;
  readonly in?: InputMaybe<ReadonlyArray<InputMaybe<Scalars['Int']['input']>>>;
  readonly lt?: InputMaybe<Scalars['Int']['input']>;
  readonly lte?: InputMaybe<Scalars['Int']['input']>;
  readonly neq?: InputMaybe<Scalars['Int']['input']>;
  readonly ngt?: InputMaybe<Scalars['Int']['input']>;
  readonly ngte?: InputMaybe<Scalars['Int']['input']>;
  readonly nin?: InputMaybe<ReadonlyArray<InputMaybe<Scalars['Int']['input']>>>;
  readonly nlt?: InputMaybe<Scalars['Int']['input']>;
  readonly nlte?: InputMaybe<Scalars['Int']['input']>;
};

export type Item = SearchContent & {
  readonly __typename?: 'Item';
  readonly abilities: ReadonlyArray<Ability>;
  /** Armor value, block rating on shields */
  readonly armor: Scalars['UnsignedShort']['output'];
  readonly buffs: ReadonlyArray<Ability>;
  readonly careerRestriction: ReadonlyArray<Career>;
  /** Description */
  readonly description: Scalars['String']['output'];
  /** Weapon DPS */
  readonly dps: Scalars['UnsignedShort']['output'];
  /** Creatures that drop this item */
  readonly dropsFromCreatures?: Maybe<DropsFromCreaturesConnection>;
  /** Game Objects that drop this item */
  readonly dropsFromGameObjects?: Maybe<DropsFromGameObjectsConnection>;
  readonly iconUrl: Scalars['URL']['output'];
  /** Id */
  readonly id: Scalars['ID']['output'];
  /** Item level */
  readonly itemLevel: Scalars['Byte']['output'];
  readonly itemSet?: Maybe<ItemSet>;
  /** Level requirement */
  readonly levelRequirement: Scalars['Byte']['output'];
  /** Name */
  readonly name: Scalars['String']['output'];
  readonly raceRestriction: ReadonlyArray<Race>;
  /** Rarity level */
  readonly rarity: ItemRarity;
  /** Renown rank requirement */
  readonly renownRankRequirement: Scalars['Byte']['output'];
  /** Chapters that reward this item */
  readonly rewardedFromChapters?: Maybe<RewardedFromChaptersConnection>;
  /** Quests that reward this item */
  readonly rewardedFromQuests?: Maybe<RewardedFromQuestsConnection>;
  /** Character equipment slot */
  readonly slot: EquipSlot;
  /** Vendors that sell this item */
  readonly soldByVendors?: Maybe<SoldByVendorsConnection>;
  /** Weapon speed */
  readonly speed: Scalars['UnsignedShort']['output'];
  readonly stats: ReadonlyArray<ItemStat>;
  /** Number of talisman slots */
  readonly talismanSlots: Scalars['Byte']['output'];
  /** Type */
  readonly type: ItemType;
  /** Unique equipped */
  readonly uniqueEquipped: Scalars['Boolean']['output'];
  /** Vendors that trade this item */
  readonly usedToPurchase?: Maybe<UsedToPurchaseConnection>;
};


export type ItemDropsFromCreaturesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type ItemDropsFromGameObjectsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type ItemRewardedFromChaptersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type ItemRewardedFromQuestsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type ItemSoldByVendorsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type ItemUsedToPurchaseArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  slot?: InputMaybe<EquipSlot>;
  usableByCareer?: InputMaybe<Career>;
};

export type ItemBindType =
  /** Bound to account on equip */
  | 'ACCOUNT_BIND_ON_EQUIP'
  /** Bound to account on pickup */
  | 'ACCOUNT_BIND_ON_PICKUP'
  /** Bound to character on equip */
  | 'BIND_ON_EQUIP'
  /** Bound to character on pickup */
  | 'BIND_ON_PICKUP'
  /** Not Bound */
  | 'NONE';

export type ItemExpirationTimeType =
  /** Time offset is absolute (i.e. unix timestamp) */
  | 'ABSOLUTE'
  /** Time offset is when a live event ends. */
  | 'LIVE_EVENT'
  /** Time offset is relative to current time */
  | 'RELATIVE'
  /** This will expire on a hardcoded time (after next zandri expedition) */
  | 'ZANDRI_EXPEDITION';

export type ItemExpirationType =
  /** Normal non expiring items */
  | 'NON_EXPIRING'
  /** Expire stats on equip */
  | 'ON_EQUIP'
  /** Expire starts on pickup */
  | 'ON_PICKUP';

/** Item filtering options */
export type ItemFilterInput = {
  readonly and?: InputMaybe<ReadonlyArray<ItemFilterInput>>;
  /** Armor value, block rating on shields */
  readonly armor?: InputMaybe<UnsignedShortOperationFilterInputType>;
  /** Description */
  readonly description?: InputMaybe<StringOperationFilterInput>;
  /** Weapon DPS */
  readonly dps?: InputMaybe<UnsignedShortOperationFilterInputType>;
  /** Item Id */
  readonly id?: InputMaybe<UnsignedIntOperationFilterInputType>;
  /** Item level */
  readonly itemLevel?: InputMaybe<ByteOperationFilterInput>;
  /** Level requirement */
  readonly levelRequirement?: InputMaybe<ByteOperationFilterInput>;
  /** Name */
  readonly name?: InputMaybe<StringOperationFilterInput>;
  readonly or?: InputMaybe<ReadonlyArray<ItemFilterInput>>;
  /** Rarity level */
  readonly rarity?: InputMaybe<ItemRarityOperationFilterInput>;
  /** Renown rank requirement */
  readonly renownRankRequirement?: InputMaybe<ByteOperationFilterInput>;
  /** Character equipment slot */
  readonly slot?: InputMaybe<EquipSlotOperationFilterInput>;
  /** Weapon speed */
  readonly speed?: InputMaybe<UnsignedShortOperationFilterInputType>;
  /** Number of talisman slots */
  readonly talismanSlots?: InputMaybe<ByteOperationFilterInput>;
  /** Type */
  readonly type?: InputMaybe<ItemTypeOperationFilterInput>;
  /** Unique equipped */
  readonly uniqueEquipped?: InputMaybe<BooleanOperationFilterInput>;
};

export type ItemRarity =
  | 'COMMON'
  | 'MYTHIC'
  | 'RARE'
  | 'UNCOMMON'
  | 'UTILITY'
  | 'VERY_RARE';

export type ItemRarityOperationFilterInput = {
  readonly eq?: InputMaybe<ItemRarity>;
  readonly in?: InputMaybe<ReadonlyArray<ItemRarity>>;
  readonly neq?: InputMaybe<ItemRarity>;
  readonly nin?: InputMaybe<ReadonlyArray<ItemRarity>>;
};

export type ItemSet = SearchContent & {
  readonly __typename?: 'ItemSet';
  readonly bonuses: ReadonlyArray<ItemSetBonus>;
  readonly id: Scalars['ID']['output'];
  readonly items: ReadonlyArray<Item>;
  readonly level: Scalars['Byte']['output'];
  readonly name: Scalars['String']['output'];
};

export type ItemSetBonus = {
  readonly __typename?: 'ItemSetBonus';
  readonly bonus: ItemSetBonusValue;
  readonly itemsRequired: Scalars['Byte']['output'];
};

export type ItemSetBonusValue = Ability | ItemStat;

/** Item sorting options */
export type ItemSortInput = {
  /** Armor value, block rating on shields */
  readonly armor?: InputMaybe<SortEnumType>;
  /** Description */
  readonly description?: InputMaybe<SortEnumType>;
  /** Weapon DPS */
  readonly dps?: InputMaybe<SortEnumType>;
  /** Item Id */
  readonly id?: InputMaybe<SortEnumType>;
  /** Item level */
  readonly itemLevel?: InputMaybe<SortEnumType>;
  /** Level requirement */
  readonly levelRequirement?: InputMaybe<SortEnumType>;
  /** Name */
  readonly name?: InputMaybe<SortEnumType>;
  /** Rarity level */
  readonly rarity?: InputMaybe<SortEnumType>;
  /** Renown rank requirement */
  readonly renownRankRequirement?: InputMaybe<SortEnumType>;
  /** Character equipment slot */
  readonly slot?: InputMaybe<SortEnumType>;
  /** Weapon speed */
  readonly speed?: InputMaybe<SortEnumType>;
  /** Number of talisman slots */
  readonly talismanSlots?: InputMaybe<SortEnumType>;
  /** Type */
  readonly type?: InputMaybe<SortEnumType>;
};

export type ItemStat = {
  readonly __typename?: 'ItemStat';
  /** Percentage */
  readonly percentage: Scalars['Boolean']['output'];
  /** Stat */
  readonly stat: Stat;
  /** Value */
  readonly value: Scalars['Short']['output'];
};

export type ItemType =
  | 'ACCESSORY'
  | 'ADVANCED_MOUNT'
  | 'AXE'
  | 'BASIC_MOUNT'
  | 'BASIC_SHIELD'
  | 'BOW'
  | 'CHARM'
  | 'CRAFTING'
  | 'CROSSBOW'
  | 'CURRENCY'
  | 'DAGGER'
  | 'DYE'
  | 'ENHANCEMENT'
  | 'EXPERT_SHIELD'
  | 'GUN'
  | 'HAMMER'
  | 'HEAVY_ARMOR'
  | 'LANCE'
  | 'LIGHT_ARMOR'
  | 'MARKETING'
  | 'MEDIUM_ARMOR'
  | 'MEDIUM_ROBE'
  | 'NONE'
  | 'PISTOL'
  | 'POTION'
  | 'QUEST'
  | 'REFINER_TOOL'
  | 'REPEATING_CROSSBOW'
  | 'ROBE'
  | 'SALVAGING'
  | 'SHIELD'
  | 'SIEGE'
  | 'SPEAR'
  | 'STAFF'
  | 'SWORD'
  | 'TELEPORT'
  | 'TELEPORT_GROUP'
  | 'TREASURE_CHEST'
  | 'TREASURE_KEY'
  | 'TROPHY';

export type ItemTypeOperationFilterInput = {
  readonly eq?: InputMaybe<ItemType>;
  readonly in?: InputMaybe<ReadonlyArray<ItemType>>;
  readonly neq?: InputMaybe<ItemType>;
  readonly nin?: InputMaybe<ReadonlyArray<ItemType>>;
};

/** A connection to a list of items. */
export type ItemsConnection = {
  readonly __typename?: 'ItemsConnection';
  /** A list of edges. */
  readonly edges?: Maybe<ReadonlyArray<ItemsEdge>>;
  /** A flattened list of the nodes. */
  readonly nodes?: Maybe<ReadonlyArray<Item>>;
  /** Information to aid in pagination. */
  readonly pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  readonly totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type ItemsEdge = {
  readonly __typename?: 'ItemsEdge';
  /** A cursor for use in pagination. */
  readonly cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  readonly node: Item;
};

export type Kill = {
  readonly __typename?: 'Kill';
  /** List of all enemy players contributing to the kill */
  readonly attackers: ReadonlyArray<Attacker>;
  /** Damage by attacker and source */
  readonly damage: ReadonlyArray<KillDamage>;
  /** The player who landed the killing blow */
  readonly deathblow?: Maybe<Character>;
  /** Kill Id */
  readonly id: Scalars['ID']['output'];
  /** Scenario instance, null if not in a scenario */
  readonly instance?: Maybe<ScenarioRecord>;
  /** Specifies the instance of a scenario this kill happened in */
  readonly instanceId?: Maybe<Scalars['ID']['output']>;
  /** Position of the victim at the time of the kill */
  readonly position: Position;
  /** Scenario, null if not in a scenario */
  readonly scenario?: Maybe<Scenario>;
  /**
   * ScenarioId, 0 if not in a scenario
   * @deprecated Field no longer supported
   */
  readonly scenarioId?: Maybe<Scalars['ID']['output']>;
  /** Scenario information */
  readonly scenarioRecord?: Maybe<ScenarioRecord>;
  /** Skirmish information */
  readonly skirmish?: Maybe<Skirmish>;
  /** UTC Timestamp */
  readonly time: Scalars['Int']['output'];
  /** The total renown generated from the kill, including AAO modifiers */
  readonly totalRenown: Scalars['UnsignedInt']['output'];
  /** The victim */
  readonly victim: Victim;
};

export type KillDamage = {
  readonly __typename?: 'KillDamage';
  /** Ability information */
  readonly ability?: Maybe<AbilityInfo>;
  /** The character doing the damage */
  readonly attacker?: Maybe<Character>;
  /** Type of attacker */
  readonly attackerType: KillDamageAttackerType;
  /** Damage amount */
  readonly damageAmount: Scalars['UnsignedInt']['output'];
  /** Type of damage source */
  readonly damageType: KillDamageSourceType;
};

export type KillDamageAttackerType =
  | 'OTHER'
  | 'PLAYER';

export type KillDamageSourceType =
  | 'ABILITY'
  | 'FALL_DAMAGE'
  | 'OTHER';

export type KillFilterInput = {
  readonly and?: InputMaybe<ReadonlyArray<KillFilterInput>>;
  /** Percent of the total damage done by the killer */
  readonly damagePercent?: InputMaybe<ByteOperationFilterInput>;
  /** Specifies the instance of a scenario this kill happened in */
  readonly instanceId?: InputMaybe<UuidOperationFilterInput>;
  readonly killerCareer?: InputMaybe<CareerLineOperationFilterInput>;
  readonly killerCharacterId?: InputMaybe<UnsignedIntOperationFilterInputType>;
  readonly killerGuildId?: InputMaybe<UnsignedIntOperationFilterInputType>;
  readonly killerLevel?: InputMaybe<ByteOperationFilterInput>;
  readonly killerRenownRank?: InputMaybe<ByteOperationFilterInput>;
  /** Number of assists */
  readonly numAssists?: InputMaybe<UnsignedIntOperationFilterInputType>;
  readonly or?: InputMaybe<ReadonlyArray<KillFilterInput>>;
  /** ScenarioId, 0 if not in a scenario */
  readonly scenarioId?: InputMaybe<UnsignedIntOperationFilterInputType>;
  /** Id of the skirmish the kill happened in */
  readonly skirmishId?: InputMaybe<UuidOperationFilterInput>;
  /** UTC Timestamp */
  readonly time?: InputMaybe<IntOperationFilterInput>;
  readonly victimCareer?: InputMaybe<CareerLineOperationFilterInput>;
  readonly victimCharacterId?: InputMaybe<UnsignedIntOperationFilterInputType>;
  readonly victimGuildId?: InputMaybe<UnsignedIntOperationFilterInputType>;
  readonly victimLevel?: InputMaybe<ByteOperationFilterInput>;
  readonly victimRenownRank?: InputMaybe<ByteOperationFilterInput>;
  /** Zone Id */
  readonly zoneId?: InputMaybe<UnsignedShortOperationFilterInputType>;
};

export type KillGuildLeaderboardEntry = {
  readonly __typename?: 'KillGuildLeaderboardEntry';
  /** Number of deaths */
  readonly deaths: Scalars['Int']['output'];
  /** Guild information */
  readonly guild: Guild;
  /** Number of kills */
  readonly kills: Scalars['Int']['output'];
  /** Rank */
  readonly rank: Scalars['Int']['output'];
};

export type KillLeaderboardEntry = {
  readonly __typename?: 'KillLeaderboardEntry';
  /** Character information */
  readonly character: Character;
  /** Number of deaths */
  readonly deaths: Scalars['Int']['output'];
  /** Number of kills */
  readonly kills: Scalars['Int']['output'];
  /** Rank */
  readonly rank: Scalars['Int']['output'];
};

/** A connection to a list of items. */
export type KillsConnection = {
  readonly __typename?: 'KillsConnection';
  /** A list of edges. */
  readonly edges?: Maybe<ReadonlyArray<KillsEdge>>;
  /** A flattened list of the nodes. */
  readonly nodes?: Maybe<ReadonlyArray<Kill>>;
  /** Information to aid in pagination. */
  readonly pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  readonly totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type KillsEdge = {
  readonly __typename?: 'KillsEdge';
  /** A cursor for use in pagination. */
  readonly cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  readonly node: Kill;
};

export type KillsHeatmapPoint = {
  readonly __typename?: 'KillsHeatmapPoint';
  readonly count: Scalars['UnsignedInt']['output'];
  readonly x: Scalars['UnsignedInt']['output'];
  readonly y: Scalars['UnsignedInt']['output'];
};

/** A connection to a list of items. */
export type LeaderboardConnection = {
  readonly __typename?: 'LeaderboardConnection';
  /** A list of edges. */
  readonly edges?: Maybe<ReadonlyArray<LeaderboardEdge>>;
  /** A flattened list of the nodes. */
  readonly nodes?: Maybe<ReadonlyArray<RankedLeaderboardCharacter>>;
  /** Information to aid in pagination. */
  readonly pageInfo: PageInfo;
};

/** An edge in a connection. */
export type LeaderboardEdge = {
  readonly __typename?: 'LeaderboardEdge';
  /** A cursor for use in pagination. */
  readonly cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  readonly node: RankedLeaderboardCharacter;
};

export type LiveEvent = Event & SearchContent & {
  readonly __typename?: 'LiveEvent';
  readonly endTime: Scalars['DateTime']['output'];
  /** Id of the content */
  readonly id: Scalars['ID']['output'];
  readonly name: Scalars['String']['output'];
  readonly startTime: Scalars['DateTime']['output'];
};

export type LongOperationFilterInput = {
  readonly eq?: InputMaybe<Scalars['Long']['input']>;
  readonly gt?: InputMaybe<Scalars['Long']['input']>;
  readonly gte?: InputMaybe<Scalars['Long']['input']>;
  readonly in?: InputMaybe<ReadonlyArray<InputMaybe<Scalars['Long']['input']>>>;
  readonly lt?: InputMaybe<Scalars['Long']['input']>;
  readonly lte?: InputMaybe<Scalars['Long']['input']>;
  readonly neq?: InputMaybe<Scalars['Long']['input']>;
  readonly ngt?: InputMaybe<Scalars['Long']['input']>;
  readonly ngte?: InputMaybe<Scalars['Long']['input']>;
  readonly nin?: InputMaybe<ReadonlyArray<InputMaybe<Scalars['Long']['input']>>>;
  readonly nlt?: InputMaybe<Scalars['Long']['input']>;
  readonly nlte?: InputMaybe<Scalars['Long']['input']>;
};

export type MapSetup = {
  readonly __typename?: 'MapSetup';
  /** The unique id of the map setup */
  readonly id: Scalars['ID']['output'];
  /** The NW corner X coordinate of the map */
  readonly nwCornerX: Scalars['Int']['output'];
  /** The NW corner Y coordinate of the map */
  readonly nwCornerY: Scalars['Int']['output'];
  /** The SE corner X coordinate of the map */
  readonly seCornerX: Scalars['Int']['output'];
  /** The SE corner Y coordinate of the map */
  readonly seCornerY: Scalars['Int']['output'];
};

/** A connection to a list of items. */
export type MembersConnection = {
  readonly __typename?: 'MembersConnection';
  /** A list of edges. */
  readonly edges?: Maybe<ReadonlyArray<MembersEdge>>;
  /** A flattened list of the nodes. */
  readonly nodes?: Maybe<ReadonlyArray<GuildMember>>;
  /** Information to aid in pagination. */
  readonly pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  readonly totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type MembersEdge = {
  readonly __typename?: 'MembersEdge';
  /** A cursor for use in pagination. */
  readonly cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  readonly node: GuildMember;
};

export type NullableOfTomeSectionOperationFilterInput = {
  readonly eq?: InputMaybe<TomeOfKnowledgeSection>;
  readonly in?: InputMaybe<ReadonlyArray<InputMaybe<TomeOfKnowledgeSection>>>;
  readonly neq?: InputMaybe<TomeOfKnowledgeSection>;
  readonly nin?: InputMaybe<ReadonlyArray<InputMaybe<TomeOfKnowledgeSection>>>;
};

/** Information about pagination in a connection. */
export type PageInfo = {
  readonly __typename?: 'PageInfo';
  /** When paginating forwards, the cursor to continue. */
  readonly endCursor?: Maybe<Scalars['String']['output']>;
  /** Indicates whether more edges exist following the set defined by the clients arguments. */
  readonly hasNextPage: Scalars['Boolean']['output'];
  /** Indicates whether more edges exist prior the set defined by the clients arguments. */
  readonly hasPreviousPage: Scalars['Boolean']['output'];
  /** When paginating backwards, the cursor to continue. */
  readonly startCursor?: Maybe<Scalars['String']['output']>;
};

export type PlayerFeudFilterInput = {
  readonly player1Id: Scalars['ID']['input'];
  readonly player2Id: Scalars['ID']['input'];
};

export type Position = {
  readonly __typename?: 'Position';
  /** The map setup of the zone */
  readonly mapSetup?: Maybe<MapSetup>;
  /** Zone X position */
  readonly x: Scalars['UnsignedShort']['output'];
  /** Zone Y position */
  readonly y: Scalars['UnsignedShort']['output'];
  /** Z position */
  readonly z: Scalars['UnsignedShort']['output'];
  /** Zone Info */
  readonly zone?: Maybe<Zone>;
  /** ZoneId */
  readonly zoneId: Scalars['UnsignedShort']['output'];
};

export type PublicQuest = SearchContent & {
  readonly __typename?: 'PublicQuest';
  readonly difficulty: PublicQuestDifficulty;
  readonly id: Scalars['ID']['output'];
  readonly name?: Maybe<Scalars['String']['output']>;
  readonly position: Position;
  readonly type: PublicQuestType;
};

export type PublicQuestDifficulty =
  | 'EASY'
  | 'HARD'
  | 'MEDIUM'
  | 'VERY_HARD';

export type PublicQuestType =
  | 'CITY_SIEGE'
  | 'FORTRESS'
  | 'KEEP'
  | 'LIVE_EVENT'
  | 'NONE'
  | 'PUBLIC_QUEST';

export type Query = {
  readonly __typename?: 'Query';
  /** Get an ability by its ID. */
  readonly ability?: Maybe<AbilityInfo>;
  /** Number of characters participating in one or more kills during the period */
  readonly activeCharactersStats?: Maybe<Scalars['NonNegativeInt']['output']>;
  /** Get one chapter */
  readonly chapter?: Maybe<Chapter>;
  /** Query for chapters matching a filter */
  readonly chapters?: Maybe<ChaptersConnection>;
  /** Get one character */
  readonly character?: Maybe<Character>;
  /** Query for CharacterRatings matching a filter */
  readonly characterRatings?: Maybe<CharacterRatingsConnection>;
  /** Query for characters matching a filter */
  readonly characters?: Maybe<CharactersConnection>;
  /** Get one creature */
  readonly creature?: Maybe<Creature>;
  /** Query for creatures matching a filter */
  readonly creatures?: Maybe<CreaturesConnection>;
  readonly events: ReadonlyArray<Event>;
  /** Get one game object */
  readonly gameObject?: Maybe<GameObject>;
  /** Query for game objects matching a filter */
  readonly gameObjects?: Maybe<GameObjectsConnection>;
  /** Get one guild */
  readonly guild?: Maybe<Guild>;
  /** Query for guilds matching a filter */
  readonly guilds?: Maybe<GuildsConnection>;
  /** Get information on an instance */
  readonly instance?: Maybe<Instance>;
  /** Get information on an instance encounter run */
  readonly instanceEncounterRun?: Maybe<InstanceEncounterRun>;
  /** Query for instance encounter runs matching a filter */
  readonly instanceEncounterRuns?: Maybe<InstanceEncounterRunsConnection>;
  /** Get information on an instance run */
  readonly instanceRun?: Maybe<InstanceRun>;
  /** Query for instance runs matching a filter */
  readonly instanceRuns?: Maybe<InstanceRunsConnection>;
  /** Query for instances matching a filter */
  readonly instances?: Maybe<InstancesConnection>;
  /** Get one item by Id */
  readonly item?: Maybe<Item>;
  /** Query for items matching a filter */
  readonly items?: Maybe<ItemsConnection>;
  /** Get one kill */
  readonly kill?: Maybe<Kill>;
  /** Query for kills matching a filter */
  readonly kills?: Maybe<KillsConnection>;
  readonly killsHeatmap: ReadonlyArray<KillsHeatmapPoint>;
  readonly monthlyGuildKillLeaderboard: ReadonlyArray<KillGuildLeaderboardEntry>;
  readonly monthlyKillLeaderboard: ReadonlyArray<KillLeaderboardEntry>;
  /** Get one guild */
  readonly quest?: Maybe<Quest>;
  /** Query for quests matching a filter */
  readonly quests?: Maybe<QuestsConnection>;
  readonly rankedSeason?: Maybe<RankedSeason>;
  readonly rankedSeasons: ReadonlyArray<RankedSeason>;
  /** Get scenario result from instance id */
  readonly scenario?: Maybe<ScenarioRecord>;
  /** Query for scenario records matching a filter */
  readonly scenarios?: Maybe<ScenariosConnection>;
  /** Unified search */
  readonly search?: Maybe<SearchConnection>;
  /** Get one skirmish */
  readonly skirmish?: Maybe<Skirmish>;
  /** Query for skirmishes records matching a filter */
  readonly skirmishes?: Maybe<SkirmishesConnection>;
  /** Query for Tome of Knowledge Achievement entries matching a filter */
  readonly tomeOfKnowledgeAchievementEntries?: Maybe<TomeOfKnowledgeAchievementEntriesConnection>;
  /** Get one Tome of Knowledge Achievement entry by Id */
  readonly tomeOfKnowledgeAchievementEntry?: Maybe<TomeOfKnowledgeAchievementEntry>;
  /** Get one Tome of Knowledge Achievement subtype by Id */
  readonly tomeOfKnowledgeAchievementSubType?: Maybe<TomeOfKnowledgeAchievementType>;
  /** Get one Tome of Knowledge Achievement type by Id */
  readonly tomeOfKnowledgeAchievementType?: Maybe<TomeOfKnowledgeAchievementType>;
  /** Query for Tome of Knowledge Achievement subtypes matching a filter */
  readonly tomeOfKnowledgeAchievementTypes: ReadonlyArray<TomeOfKnowledgeAchievementType>;
  /** Query for Tome of Knowledge entries matching a filter */
  readonly tomeOfKnowledgeEntries?: Maybe<TomeOfKnowledgeEntriesConnection>;
  /** Get one Tome of Knowledge entry by Id */
  readonly tomeOfKnowledgeEntry?: Maybe<TomeOfKnowledgeEntry>;
  /** Get top skirmishes in last seven days */
  readonly topSkirmishes: ReadonlyArray<Skirmish>;
  /** Query for War Journal entries matching a filter */
  readonly warJournalEntries?: Maybe<ReadonlyArray<Maybe<WarJournalEntry>>>;
  /** Get one War Journal Entry by Id */
  readonly warJournalEntry?: Maybe<WarJournalEntry>;
  /** Get one War Journal Storyline by Id */
  readonly warJournalStoryline?: Maybe<WarJournalStoryline>;
  /** Query for War Journal Storylines matching a filter */
  readonly warJournalStorylines: ReadonlyArray<WarJournalStoryline>;
  readonly weeklyGuildKillLeaderboard: ReadonlyArray<KillGuildLeaderboardEntry>;
  readonly weeklyKillLeaderboard: ReadonlyArray<KillLeaderboardEntry>;
};


export type QueryAbilityArgs = {
  id: Scalars['ID']['input'];
};


export type QueryActiveCharactersStatsArgs = {
  career?: InputMaybe<Career>;
  from: Scalars['DateTime']['input'];
  maxLevel?: InputMaybe<Scalars['Byte']['input']>;
  minLevel?: InputMaybe<Scalars['Byte']['input']>;
  to: Scalars['DateTime']['input'];
};


export type QueryChapterArgs = {
  id: Scalars['ID']['input'];
};


export type QueryChaptersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<ReadonlyArray<ChapterSortInput>>;
  where?: InputMaybe<ChapterFilterInput>;
};


export type QueryCharacterArgs = {
  id: Scalars['ID']['input'];
};


export type QueryCharacterRatingsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<ReadonlyArray<CharacterRatingSortInput>>;
  where?: InputMaybe<CharacterRatingFilterInput>;
};


export type QueryCharactersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<ReadonlyArray<CharacterSortInput>>;
  where?: InputMaybe<CharacterFilterInput>;
};


export type QueryCreatureArgs = {
  id: Scalars['ID']['input'];
};


export type QueryCreaturesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<ReadonlyArray<CreatureSortInput>>;
  where?: InputMaybe<CreatureFilterInput>;
};


export type QueryGameObjectArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGameObjectsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<ReadonlyArray<GameObjectProtoSortInput>>;
  where?: InputMaybe<GameObjectProtoFilterInput>;
};


export type QueryGuildArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGuildsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<ReadonlyArray<GuildInfoSortInput>>;
  where?: InputMaybe<GuildFilterInput>;
};


export type QueryInstanceArgs = {
  id: Scalars['ID']['input'];
};


export type QueryInstanceEncounterRunArgs = {
  id: Scalars['ID']['input'];
};


export type QueryInstanceEncounterRunsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<ReadonlyArray<InstanceEncounterRunSortInput>>;
  where?: InputMaybe<InstanceEncounterRunFilterInput>;
};


export type QueryInstanceRunArgs = {
  id: Scalars['ID']['input'];
};


export type QueryInstanceRunsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<ReadonlyArray<InstanceRunSortInput>>;
  where?: InputMaybe<InstanceRunFilterInput>;
};


export type QueryInstancesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<ReadonlyArray<InstanceSortInput>>;
  where?: InputMaybe<InstanceFilterInput>;
};


export type QueryItemArgs = {
  id: Scalars['ID']['input'];
};


export type QueryItemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  hasStats?: InputMaybe<ReadonlyArray<Stat>>;
  last?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<ReadonlyArray<ItemSortInput>>;
  usableByCareer?: InputMaybe<Career>;
  where?: InputMaybe<ItemFilterInput>;
};


export type QueryKillArgs = {
  id: Scalars['ID']['input'];
  includeAssists?: Scalars['Boolean']['input'];
};


export type QueryKillsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  from?: InputMaybe<Scalars['Long']['input']>;
  guildFeudFilter?: InputMaybe<GuildFeudFilterInput>;
  includeAssists?: InputMaybe<Scalars['Boolean']['input']>;
  instanceId?: InputMaybe<Scalars['String']['input']>;
  killerGuildId?: InputMaybe<Scalars['ID']['input']>;
  killerId?: InputMaybe<Scalars['ID']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  playerFeudFilter?: InputMaybe<PlayerFeudFilterInput>;
  scenarioId?: InputMaybe<Scalars['ID']['input']>;
  soloOnly?: Scalars['Boolean']['input'];
  to?: InputMaybe<Scalars['Long']['input']>;
  victimGuildId?: InputMaybe<Scalars['ID']['input']>;
  victimId?: InputMaybe<Scalars['ID']['input']>;
  where?: InputMaybe<KillFilterInput>;
  zoneId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryKillsHeatmapArgs = {
  from?: InputMaybe<Scalars['Long']['input']>;
  instanceId?: InputMaybe<Scalars['ID']['input']>;
  killerGuildId?: InputMaybe<Scalars['ID']['input']>;
  killerId?: InputMaybe<Scalars['ID']['input']>;
  soloOnly?: Scalars['Boolean']['input'];
  to?: InputMaybe<Scalars['Long']['input']>;
  victimGuildId?: InputMaybe<Scalars['ID']['input']>;
  victimId?: InputMaybe<Scalars['ID']['input']>;
  zoneId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryMonthlyGuildKillLeaderboardArgs = {
  month: Scalars['Int']['input'];
  year: Scalars['Int']['input'];
};


export type QueryMonthlyKillLeaderboardArgs = {
  month: Scalars['Int']['input'];
  year: Scalars['Int']['input'];
};


export type QueryQuestArgs = {
  id: Scalars['ID']['input'];
};


export type QueryQuestsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<ReadonlyArray<QuestSortInput>>;
  where?: InputMaybe<QuestFilterInput>;
};


export type QueryRankedSeasonArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryScenarioArgs = {
  id: Scalars['ID']['input'];
};


export type QueryScenariosArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  characterId?: InputMaybe<Scalars['ID']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  from?: InputMaybe<Scalars['Long']['input']>;
  guildId?: InputMaybe<Scalars['ID']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  premadeOnly?: InputMaybe<Scalars['Boolean']['input']>;
  queueType?: InputMaybe<ScenarioQueueType>;
  scenarioId?: InputMaybe<Scalars['ID']['input']>;
  to?: InputMaybe<Scalars['Long']['input']>;
  where?: InputMaybe<ScenarioRecordFilterInput>;
  wins?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QuerySearchArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};


export type QuerySkirmishArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySkirmishesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  characterId?: InputMaybe<Scalars['ID']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  guildId?: InputMaybe<Scalars['ID']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<SkirmishFilterInput>;
};


export type QueryTomeOfKnowledgeAchievementEntriesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<TomeOfKnowledgeAchievementEntryFilterInput>;
};


export type QueryTomeOfKnowledgeAchievementEntryArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTomeOfKnowledgeAchievementSubTypeArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTomeOfKnowledgeAchievementTypeArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTomeOfKnowledgeEntriesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<TomeOfKnowledgeEntryFilterInput>;
};


export type QueryTomeOfKnowledgeEntryArgs = {
  id: Scalars['ID']['input'];
};


export type QueryWarJournalEntriesArgs = {
  where?: InputMaybe<WarJournalEntryFilterInput>;
};


export type QueryWarJournalEntryArgs = {
  id: Scalars['ID']['input'];
};


export type QueryWarJournalStorylineArgs = {
  id: Scalars['ID']['input'];
};


export type QueryWarJournalStorylinesArgs = {
  where?: InputMaybe<WarJournalStorylineFilterInput>;
};


export type QueryWeeklyGuildKillLeaderboardArgs = {
  week: Scalars['Int']['input'];
  year: Scalars['Int']['input'];
};


export type QueryWeeklyKillLeaderboardArgs = {
  week: Scalars['Int']['input'];
  year: Scalars['Int']['input'];
};

/** Info about a quest */
export type Quest = SearchContent & {
  readonly __typename?: 'Quest';
  /** Available to careers */
  readonly careerRestriction: ReadonlyArray<Career>;
  /** Number of choice rewards */
  readonly choiceCount: Scalars['Byte']['output'];
  /** Description */
  readonly description?: Maybe<Scalars['String']['output']>;
  /** Gold reward (in brass coins) */
  readonly gold: Scalars['UnsignedInt']['output'];
  /** Id of the quest */
  readonly id: Scalars['ID']['output'];
  /** Journal Entry Text */
  readonly journalEntry?: Maybe<Scalars['String']['output']>;
  /** Maximum level */
  readonly maxLevel: Scalars['Byte']['output'];
  /** Maximum renown */
  readonly maxRenown: Scalars['Byte']['output'];
  /** Minimum level */
  readonly minLevel: Scalars['Byte']['output'];
  /** Minimum renown */
  readonly minRenown: Scalars['Byte']['output'];
  /** Name */
  readonly name: Scalars['String']['output'];
  /** Objectives */
  readonly objectives: ReadonlyArray<QuestObjective>;
  /** Available to races */
  readonly raceRestriction: ReadonlyArray<Race>;
  /** Repeatable Type */
  readonly repeatableType: QuestRepeatableType;
  /** Choice rewards */
  readonly rewardsChoice: ReadonlyArray<QuestReward>;
  /** Given rewards */
  readonly rewardsGiven: ReadonlyArray<QuestReward>;
  /** Creatures starting quest */
  readonly starterCreatures: ReadonlyArray<Creature>;
  /** Quest Type */
  readonly type: QuestTypeFlagsFlags;
  /** XP Reward */
  readonly xp: Scalars['UnsignedInt']['output'];
};

export type QuestFilterInput = {
  readonly and?: InputMaybe<ReadonlyArray<QuestFilterInput>>;
  readonly careerRestriction?: InputMaybe<CareerMaskOperationFilterInput>;
  readonly id?: InputMaybe<UnsignedShortOperationFilterInputType>;
  readonly name?: InputMaybe<StringOperationFilterInput>;
  readonly or?: InputMaybe<ReadonlyArray<QuestFilterInput>>;
  readonly raceRestriction?: InputMaybe<RaceMaskOperationFilterInput>;
  readonly type?: InputMaybe<QuestTypeFlagsOperationFilterInput>;
};

/** Info about a quest objective */
export type QuestObjective = {
  readonly __typename?: 'QuestObjective';
  /** Number of times the objective needs to be done */
  readonly count: Scalars['UnsignedInt']['output'];
  /** Objective description */
  readonly description: Scalars['String']['output'];
};

export type QuestRepeatableType =
  /** Repeatable */
  | 'DONE'
  /** Not repeatable */
  | 'NONE'
  /** Each Week */
  | 'WEEKLY';

/** Info about a quest reward */
export type QuestReward = {
  readonly __typename?: 'QuestReward';
  /** Number of items rewarded */
  readonly count: Scalars['UnsignedShort']['output'];
  /** Item rewarded */
  readonly item: Item;
};

export type QuestSortInput = {
  readonly id?: InputMaybe<SortEnumType>;
  readonly name?: InputMaybe<SortEnumType>;
  readonly type?: InputMaybe<SortEnumType>;
};

export type QuestTypeFlags =
  | 'EPIC'
  | 'GROUP'
  | 'NONE'
  | 'PLAYER_KILL'
  | 'RV_R'
  | 'TOME'
  | 'TRAVEL';

export type QuestTypeFlagsFlags = {
  readonly __typename?: 'QuestTypeFlagsFlags';
  readonly isEpic: Scalars['Boolean']['output'];
  readonly isGroup: Scalars['Boolean']['output'];
  readonly isNone: Scalars['Boolean']['output'];
  readonly isPlayerKill: Scalars['Boolean']['output'];
  readonly isRvR: Scalars['Boolean']['output'];
  readonly isTome: Scalars['Boolean']['output'];
  readonly isTravel: Scalars['Boolean']['output'];
};

export type QuestTypeFlagsFlagsInput = {
  readonly isEpic?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isGroup?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isNone?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isPlayerKill?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isRvR?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isTome?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isTravel?: InputMaybe<Scalars['Boolean']['input']>;
};

export type QuestTypeFlagsOperationFilterInput = {
  readonly eq?: InputMaybe<QuestTypeFlagsFlagsInput>;
  readonly in?: InputMaybe<ReadonlyArray<QuestTypeFlagsFlagsInput>>;
  readonly neq?: InputMaybe<QuestTypeFlagsFlagsInput>;
  readonly nin?: InputMaybe<ReadonlyArray<QuestTypeFlagsFlagsInput>>;
};

/** A connection to a list of items. */
export type QuestsConnection = {
  readonly __typename?: 'QuestsConnection';
  /** A list of edges. */
  readonly edges?: Maybe<ReadonlyArray<QuestsEdge>>;
  /** A flattened list of the nodes. */
  readonly nodes?: Maybe<ReadonlyArray<Quest>>;
  /** Information to aid in pagination. */
  readonly pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  readonly totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type QuestsEdge = {
  readonly __typename?: 'QuestsEdge';
  /** A cursor for use in pagination. */
  readonly cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  readonly node: Quest;
};

/** Player Races */
export type Race =
  | 'CHAOS'
  | 'DARK_ELF'
  | 'DWARF'
  | 'EMPIRE'
  | 'GOBLIN'
  | 'HIGH_ELF'
  | 'ORC';

export type RaceMask =
  | 'CHAOS'
  | 'DARK_ELF'
  | 'DWARF'
  | 'EMPIRE'
  | 'GOBLIN'
  | 'HIGH_ELF'
  | 'ORC';

export type RaceMaskFlagsInput = {
  readonly isChaos?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isDarkElf?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isDwarf?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isEmpire?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isGoblin?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isHighElf?: InputMaybe<Scalars['Boolean']['input']>;
  readonly isOrc?: InputMaybe<Scalars['Boolean']['input']>;
};

export type RaceMaskOperationFilterInput = {
  readonly eq?: InputMaybe<RaceMaskFlagsInput>;
  readonly in?: InputMaybe<ReadonlyArray<RaceMaskFlagsInput>>;
  readonly neq?: InputMaybe<RaceMaskFlagsInput>;
  readonly nin?: InputMaybe<ReadonlyArray<RaceMaskFlagsInput>>;
};

export type RankedLeaderboardCharacter = {
  readonly __typename?: 'RankedLeaderboardCharacter';
  /** Rank within career */
  readonly careerRank: Scalars['UnsignedInt']['output'];
  readonly character: Character;
  /** Draws */
  readonly draws: Scalars['UnsignedInt']['output'];
  readonly guild?: Maybe<Guild>;
  /** Losses */
  readonly losses: Scalars['UnsignedInt']['output'];
  /** Matches needed */
  readonly matchesNeeded: Scalars['UnsignedInt']['output'];
  /** Rank */
  readonly rank: Scalars['UnsignedInt']['output'];
  /** Rating */
  readonly rating: Scalars['UnsignedInt']['output'];
  /** Rating type */
  readonly ratingType: RankedLeaderboardRatingType;
  /** Renown rank after last match in season */
  readonly renownRank: Scalars['Byte']['output'];
  /** Season ID */
  readonly seasonId: Scalars['UnsignedShort']['output'];
  /** Wins */
  readonly wins: Scalars['UnsignedInt']['output'];
};

export type RankedLeaderboardRatingType =
  | 'RANKED_GROUP'
  | 'RANKED_SOLO';

export type RankedSeason = {
  readonly __typename?: 'RankedSeason';
  readonly end: Scalars['DateTime']['output'];
  /** Season ID */
  readonly id: Scalars['ID']['output'];
  readonly leaderboard?: Maybe<LeaderboardConnection>;
  /** Is main season or off season */
  readonly mainSeason: Scalars['Boolean']['output'];
  /** Season name */
  readonly name: Scalars['String']['output'];
  readonly start: Scalars['DateTime']['output'];
};


export type RankedSeasonLeaderboardArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  type: RankedLeaderboardRatingType;
  where?: InputMaybe<CharacterSeasonStatsFilterInput>;
};

export type RatingType =
  | 'CASUAL'
  | 'CITY'
  | 'RANKED_GROUP'
  | 'RANKED_SOLO';

export type RatingTypeOperationFilterInput = {
  readonly eq?: InputMaybe<RatingType>;
  readonly in?: InputMaybe<ReadonlyArray<RatingType>>;
  readonly neq?: InputMaybe<RatingType>;
  readonly nin?: InputMaybe<ReadonlyArray<RatingType>>;
};

export type Realm =
  /** Destruction */
  | 'DESTRUCTION'
  /** No realm */
  | 'NEUTRAL'
  /** Order */
  | 'ORDER';

export type RealmsOperationFilterInput = {
  readonly eq?: InputMaybe<Realm>;
  readonly in?: InputMaybe<ReadonlyArray<Realm>>;
  readonly neq?: InputMaybe<Realm>;
  readonly nin?: InputMaybe<ReadonlyArray<Realm>>;
};

/** A connection to a list of items. */
export type RewardedFromChaptersConnection = {
  readonly __typename?: 'RewardedFromChaptersConnection';
  /** A list of edges. */
  readonly edges?: Maybe<ReadonlyArray<RewardedFromChaptersEdge>>;
  /** A flattened list of the nodes. */
  readonly nodes?: Maybe<ReadonlyArray<Chapter>>;
  /** Information to aid in pagination. */
  readonly pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  readonly totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type RewardedFromChaptersEdge = {
  readonly __typename?: 'RewardedFromChaptersEdge';
  /** A cursor for use in pagination. */
  readonly cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  readonly node: Chapter;
};

/** A connection to a list of items. */
export type RewardedFromQuestsConnection = {
  readonly __typename?: 'RewardedFromQuestsConnection';
  /** A list of edges. */
  readonly edges?: Maybe<ReadonlyArray<RewardedFromQuestsEdge>>;
  /** A flattened list of the nodes. */
  readonly nodes?: Maybe<ReadonlyArray<Quest>>;
  /** Information to aid in pagination. */
  readonly pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  readonly totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type RewardedFromQuestsEdge = {
  readonly __typename?: 'RewardedFromQuestsEdge';
  /** A cursor for use in pagination. */
  readonly cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  readonly node: Quest;
};

export type Scenario = SearchContent & {
  readonly __typename?: 'Scenario';
  /** The unique id of the scenario */
  readonly id: Scalars['ID']['output'];
  /** The name of the scenario */
  readonly name: Scalars['String']['output'];
  /** Zone information */
  readonly zone: Zone;
};

export type ScenarioEnabledType =
  | 'ALWAYS_ENABLED'
  | 'BY_COMMAND'
  | 'DEVELOPER'
  | 'DISABLED'
  | 'NORMAL';

export type ScenarioQueueType =
  /** City Sieges */
  | 'CITY_SIEGE'
  /** Group Ranked scenarios */
  | 'GROUP_RANKED'
  /** Discordant scenarios */
  | 'SOLO'
  /** Solo Ranked scenarios */
  | 'SOLO_RANKED'
  /** Normal scenarios */
  | 'STANDARD';

export type ScenarioRecord = {
  readonly __typename?: 'ScenarioRecord';
  /** The end time of the scenario */
  readonly endTime: Scalars['Long']['output'];
  /** Scenario instance Id */
  readonly id: Scalars['ID']['output'];
  /** The kills that occurred in the scenario */
  readonly kills: ReadonlyArray<Kill>;
  /** Points for each team, 0 is order, 1 is destruction */
  readonly points: ReadonlyArray<Maybe<Scalars['UnsignedInt']['output']>>;
  /** Queue type */
  readonly queueType: Scalars['Byte']['output'];
  /** Scenario information */
  readonly scenario: Scenario;
  /** Scenario Id */
  readonly scenarioId: Scalars['ID']['output'];
  /** Scoreboard entries */
  readonly scoreboardEntries: ReadonlyArray<ScenarioScoreboardEntry>;
  /** The skirmishes that occurred in the scenario */
  readonly skirmishes: ReadonlyArray<Skirmish>;
  /** The start time of the scenario */
  readonly startTime: Scalars['Long']['output'];
  /** Scenario tier */
  readonly tier: Scalars['Byte']['output'];
  /** Winning team, 0 is order, 1 is destruction */
  readonly winner: Scalars['Byte']['output'];
};

export type ScenarioRecordFilterInput = {
  readonly and?: InputMaybe<ReadonlyArray<ScenarioRecordFilterInput>>;
  /** The end time of the scenario */
  readonly endTime?: InputMaybe<LongOperationFilterInput>;
  /** Scenario instance Id */
  readonly id?: InputMaybe<UuidOperationFilterInput>;
  readonly or?: InputMaybe<ReadonlyArray<ScenarioRecordFilterInput>>;
  /** Queue type */
  readonly queueType?: InputMaybe<ByteOperationFilterInput>;
  /** Scenario Id */
  readonly scenarioId?: InputMaybe<UnsignedIntOperationFilterInputType>;
  /** The start time of the scenario */
  readonly startTime?: InputMaybe<LongOperationFilterInput>;
  /** Scenario tier */
  readonly tier?: InputMaybe<ByteOperationFilterInput>;
  /** Winning team, 0 is order, 1 is destruction */
  readonly winner?: InputMaybe<ByteOperationFilterInput>;
};

export type ScenarioScoreboardEntry = {
  readonly __typename?: 'ScenarioScoreboardEntry';
  /** Character information */
  readonly character: Character;
  /** Damage */
  readonly damage: Scalars['UnsignedInt']['output'];
  /** Damage Received */
  readonly damageReceived: Scalars['UnsignedInt']['output'];
  /** Death blows */
  readonly deathBlows: Scalars['UnsignedInt']['output'];
  /** Deaths */
  readonly deaths: Scalars['UnsignedInt']['output'];
  /** Guild at the time of the scenario */
  readonly guild?: Maybe<Guild>;
  /** Healing */
  readonly healing: Scalars['UnsignedInt']['output'];
  /** Healing of others */
  readonly healingOthers: Scalars['UnsignedInt']['output'];
  /** Healing of self */
  readonly healingReceived: Scalars['UnsignedInt']['output'];
  /** Healing of self */
  readonly healingSelf: Scalars['UnsignedInt']['output'];
  /** Damage contributing to kills */
  readonly killDamage: Scalars['UnsignedInt']['output'];
  /** Kills */
  readonly kills: Scalars['UnsignedInt']['output'];
  /** Solo Kills */
  readonly killsSolo: Scalars['UnsignedInt']['output'];
  /** Level at the time of the scenario */
  readonly level: Scalars['Byte']['output'];
  /** Objective Score */
  readonly objectiveScore: Scalars['UnsignedInt']['output'];
  /** Damage Prevented */
  readonly protection: Scalars['UnsignedInt']['output'];
  /** Protection of others */
  readonly protectionOthers: Scalars['UnsignedInt']['output'];
  /** Protection Received */
  readonly protectionReceived: Scalars['UnsignedInt']['output'];
  /** Protection of self */
  readonly protectionSelf: Scalars['UnsignedInt']['output'];
  /** If true the player left the scenario before it ended */
  readonly quitter: Scalars['Boolean']['output'];
  /** Renown rank at the time of the scenario */
  readonly renownRank: Scalars['Byte']['output'];
  /** Resurrections */
  readonly resurrectionsDone: Scalars['UnsignedInt']['output'];
  /** The team of the player. Normally Order=0, Destruction=1. */
  readonly team: Scalars['Byte']['output'];
};

export type ScenarioType =
  | 'CAPTURE_THE_FLAG'
  | 'CITY_SIEGE'
  | 'DAEMON_BALL'
  | 'DEATHMATCH'
  | 'DOMINATION'
  | 'DOMINATION_DRAGONS_BANE'
  | 'DOMINATION_EC'
  | 'DOMINATION_FORGE'
  | 'DOMINATION_KHAINE'
  | 'DOMINATION_PUSH'
  | 'DOMINATION_PUSH_CENTER'
  | 'DOMINATION_TWISTING_TOWER'
  | 'DOUBLE_DOMINATION'
  | 'DROP_BOMB'
  | 'DROP_PART'
  | 'FLAG_DOMINATION'
  | 'FLAG_DOMINATION_CREATURE_BOSS'
  | 'MONSTER_DEFEND'
  | 'MURDERBALL'
  | 'PICK_UP_GROUP_RANDOM'
  | 'RANDOM6V6'
  | 'REVERSE_DAEMON_BALL'
  | 'ROTATING_KING_OF_THE_HILL';

/** A connection to a list of items. */
export type ScenariosConnection = {
  readonly __typename?: 'ScenariosConnection';
  /** A list of edges. */
  readonly edges?: Maybe<ReadonlyArray<ScenariosEdge>>;
  /** A flattened list of the nodes. */
  readonly nodes?: Maybe<ReadonlyArray<ScenarioRecord>>;
  /** Information to aid in pagination. */
  readonly pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  readonly totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type ScenariosEdge = {
  readonly __typename?: 'ScenariosEdge';
  /** A cursor for use in pagination. */
  readonly cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  readonly node: ScenarioRecord;
};

/** A connection to a list of items. */
export type ScoreboardEntriesConnection = {
  readonly __typename?: 'ScoreboardEntriesConnection';
  /** A list of edges. */
  readonly edges?: Maybe<ReadonlyArray<ScoreboardEntriesEdge>>;
  /** A flattened list of the nodes. */
  readonly nodes?: Maybe<ReadonlyArray<SkirmishScoreboardEntry>>;
  /** Information to aid in pagination. */
  readonly pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  readonly totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type ScoreboardEntriesEdge = {
  readonly __typename?: 'ScoreboardEntriesEdge';
  /** A cursor for use in pagination. */
  readonly cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  readonly node: SkirmishScoreboardEntry;
};

/** A connection to a list of items. */
export type SearchConnection = {
  readonly __typename?: 'SearchConnection';
  /** A list of edges. */
  readonly edges?: Maybe<ReadonlyArray<SearchEdge>>;
  /** A flattened list of the nodes. */
  readonly nodes?: Maybe<ReadonlyArray<SearchContent>>;
  /** Information to aid in pagination. */
  readonly pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  readonly totalCount: Scalars['Int']['output'];
};

export type SearchContent = {
  /** Id of the content */
  readonly id: Scalars['ID']['output'];
  readonly name?: Maybe<Scalars['String']['output']>;
};

/** An edge in a connection. */
export type SearchEdge = {
  readonly __typename?: 'SearchEdge';
  /** A cursor for use in pagination. */
  readonly cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  readonly node: SearchContent;
};

export type Sex =
  /** Female */
  | 'FEMALE'
  /** Male */
  | 'MALE';

export type Skirmish = {
  readonly __typename?: 'Skirmish';
  /** UTC Timestamp of Skirmish end */
  readonly endTime: Scalars['Long']['output'];
  /** Heatmap of kills that happened during this skirmish primary zone */
  readonly heatmap: ReadonlyArray<KillsHeatmapPoint>;
  /** Skirmish Id */
  readonly id: Scalars['ID']['output'];
  /** Scenario instance, null if not in a scenario */
  readonly instance?: Maybe<ScenarioRecord>;
  /** Damage leading to player kills in this skirmish */
  readonly killDamage: ReadonlyArray<KillDamage>;
  /** Damage leading to player kills in this skirmish from a specific character */
  readonly killDamageByCharacter: ReadonlyArray<KillDamage>;
  /** Kills that happened during this skirmish */
  readonly kills?: Maybe<KillsConnection>;
  /** Total number of kills that happened during this skirmish */
  readonly numberOfKills: Scalars['Int']['output'];
  /** Total number of kills that happened during this skirmish for Destruction */
  readonly numberOfKillsDestruction: Scalars['Int']['output'];
  /** Total number of kills that happened during this skirmish for Order */
  readonly numberOfKillsOrder: Scalars['Int']['output'];
  /** Total number of players that participated in this skirmish */
  readonly numberOfPlayers: Scalars['Int']['output'];
  /** Total number of destruction players that participated in this skirmish */
  readonly numberOfPlayersDestruction: Scalars['Int']['output'];
  /** Total number of order players that participated in this skirmish */
  readonly numberOfPlayersOrder: Scalars['Int']['output'];
  /** Primary Zone Info */
  readonly primaryZone?: Maybe<Zone>;
  /** Primary Zone Area Info */
  readonly primaryZoneArea?: Maybe<ZoneArea>;
  /** Scenario, null if not in a scenario */
  readonly scenario?: Maybe<Scenario>;
  /** Scoreboard entries */
  readonly scoreboardEntries?: Maybe<ScoreboardEntriesConnection>;
  /** UTC Timestamp of Skirmish start */
  readonly startTime: Scalars['Long']['output'];
  /** Top guilds by kills */
  readonly topGuildsByKills: ReadonlyArray<SkirmishTopGuild>;
  /** Top guilds by players */
  readonly topGuildsByPlayers: ReadonlyArray<SkirmishTopGuild>;
};


export type SkirmishKillDamageByCharacterArgs = {
  id: Scalars['ID']['input'];
};


export type SkirmishKillsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type SkirmishScoreboardEntriesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<ReadonlyArray<SkirmishScoreboardEntrySortInput>>;
};

export type SkirmishFilterInput = {
  readonly and?: InputMaybe<ReadonlyArray<SkirmishFilterInput>>;
  /** End time */
  readonly endTime?: InputMaybe<LongOperationFilterInput>;
  /** Scenario instance */
  readonly instanceId?: InputMaybe<UuidOperationFilterInput>;
  /** Total number of kills */
  readonly numberOfKills?: InputMaybe<IntOperationFilterInput>;
  /** Total number of kills for destruction */
  readonly numberOfKillsDestruction?: InputMaybe<IntOperationFilterInput>;
  /** Total number of kills for order */
  readonly numberOfKillsOrder?: InputMaybe<IntOperationFilterInput>;
  /** Total number of players */
  readonly numberOfPlayers?: InputMaybe<IntOperationFilterInput>;
  /** Total number of players destruction */
  readonly numberOfPlayersDestruction?: InputMaybe<IntOperationFilterInput>;
  /** Total number of players order */
  readonly numberOfPlayersOrder?: InputMaybe<IntOperationFilterInput>;
  readonly or?: InputMaybe<ReadonlyArray<SkirmishFilterInput>>;
  /** Primary Area */
  readonly primaryAreaId?: InputMaybe<UnsignedShortOperationFilterInputType>;
  /** Primary Zone */
  readonly primaryZoneId?: InputMaybe<UnsignedShortOperationFilterInputType>;
  /** Scenario Id */
  readonly scenarioId?: InputMaybe<UnsignedShortOperationFilterInputType>;
  /** Start time */
  readonly startTime?: InputMaybe<LongOperationFilterInput>;
};

export type SkirmishScoreboardEntry = {
  readonly __typename?: 'SkirmishScoreboardEntry';
  /** If true the player left the scenario before it ended */
  readonly career: Career;
  /** Character information */
  readonly character: Character;
  /** Damage */
  readonly damage: Scalars['UnsignedInt']['output'];
  /** Damage Received */
  readonly damageReceived: Scalars['UnsignedInt']['output'];
  /** Death blows */
  readonly deathBlows: Scalars['UnsignedInt']['output'];
  /** Deaths */
  readonly deaths: Scalars['UnsignedInt']['output'];
  /** Guild at the time of the scenario */
  readonly guild?: Maybe<Guild>;
  /** Healing */
  readonly healing: Scalars['UnsignedInt']['output'];
  /** Healing of others */
  readonly healingOthers: Scalars['UnsignedInt']['output'];
  /** Healing of self */
  readonly healingReceived: Scalars['UnsignedInt']['output'];
  /** Healing of self */
  readonly healingSelf: Scalars['UnsignedInt']['output'];
  /** Damage contributing to kills */
  readonly killDamage: Scalars['UnsignedInt']['output'];
  /** Kills */
  readonly kills: Scalars['UnsignedInt']['output'];
  /** Solo Kills */
  readonly killsSolo: Scalars['UnsignedInt']['output'];
  /** Level at the time of the scenario */
  readonly level: Scalars['Byte']['output'];
  /** Damage Prevented */
  readonly protection: Scalars['UnsignedInt']['output'];
  /** Protection of others */
  readonly protectionOthers: Scalars['UnsignedInt']['output'];
  /** Protection Received */
  readonly protectionReceived: Scalars['UnsignedInt']['output'];
  /** Protection of self */
  readonly protectionSelf: Scalars['UnsignedInt']['output'];
  /** The realm of the player */
  readonly realm: Realm;
  /** Renown rank at the time of the scenario */
  readonly renownRank: Scalars['Byte']['output'];
  /** Resurrections */
  readonly resurrectionsDone: Scalars['UnsignedInt']['output'];
};

export type SkirmishScoreboardEntrySortInput = {
  readonly damage?: InputMaybe<SortEnumType>;
  readonly deathBlows?: InputMaybe<SortEnumType>;
  readonly deaths?: InputMaybe<SortEnumType>;
  readonly healing?: InputMaybe<SortEnumType>;
  readonly killDamage?: InputMaybe<SortEnumType>;
  readonly kills?: InputMaybe<SortEnumType>;
  readonly level?: InputMaybe<SortEnumType>;
  readonly protection?: InputMaybe<SortEnumType>;
  readonly renownRank?: InputMaybe<SortEnumType>;
};

export type SkirmishTopGuild = {
  readonly __typename?: 'SkirmishTopGuild';
  /** Value */
  readonly count: Scalars['Int']['output'];
  /** Guild information */
  readonly guild: Guild;
};

/** A connection to a list of items. */
export type SkirmishesConnection = {
  readonly __typename?: 'SkirmishesConnection';
  /** A list of edges. */
  readonly edges?: Maybe<ReadonlyArray<SkirmishesEdge>>;
  /** A flattened list of the nodes. */
  readonly nodes?: Maybe<ReadonlyArray<Skirmish>>;
  /** Information to aid in pagination. */
  readonly pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  readonly totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type SkirmishesEdge = {
  readonly __typename?: 'SkirmishesEdge';
  /** A cursor for use in pagination. */
  readonly cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  readonly node: Skirmish;
};

/** A connection to a list of items. */
export type SoldByVendorsConnection = {
  readonly __typename?: 'SoldByVendorsConnection';
  /** A list of edges. */
  readonly edges?: Maybe<ReadonlyArray<SoldByVendorsEdge>>;
  /** A flattened list of the nodes. */
  readonly nodes?: Maybe<ReadonlyArray<VendorItem>>;
  /** Information to aid in pagination. */
  readonly pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  readonly totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type SoldByVendorsEdge = {
  readonly __typename?: 'SoldByVendorsEdge';
  /** A cursor for use in pagination. */
  readonly cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  readonly node: VendorItem;
};

export type SortEnumType =
  | 'ASC'
  | 'DESC';

export type Stat =
  | 'ACTION_POINT_COST'
  | 'ACTION_POINT_REGEN'
  | 'AGGRO_RADIUS'
  | 'AGILITY'
  | 'APOTHECARY'
  | 'ARMOR'
  | 'ARMOR_PENETRATION'
  | 'ARMOR_PENETRATION_REDUCTION'
  | 'AUTO_ATTACK_DAMAGE'
  | 'AUTO_ATTACK_SPEED'
  | 'BALLISTIC_SKILL'
  | 'BLOCK'
  | 'BLOCK_STRIKETHROUGH'
  | 'BUILD_TIME'
  | 'BUTCHERING'
  | 'COOLDOWN'
  | 'CORPOREAL_RESISTANCE'
  | 'CRITICAL_DAMAGE'
  | 'CRITICAL_DAMAGE_TAKEN_REDUCTION'
  | 'CRITICAL_HIT_RATE'
  | 'CRITICAL_HIT_RATE_REDUCTION'
  | 'CULTIVATION'
  | 'DAMAGE_ABSORB'
  | 'DISMOUNT_CHANCE'
  | 'DISRUPT'
  | 'DISRUPT_STRIKETHROUGH'
  | 'EFFECT_BUFF'
  | 'EFFECT_RESIST'
  | 'ELEMENTAL_RESISTANCE'
  | 'EVADE'
  | 'EVADE_STRIKETHROUGH'
  | 'FORTITUDE'
  | 'GOLD_LOOTED'
  | 'GRAVITY'
  | 'HATE_CAUSED'
  | 'HATE_RECEIVED'
  | 'HEALING_POWER'
  | 'HEALTH_REGEN'
  | 'HEAL_CRIT_RATE'
  | 'INCOMING_DAMAGE'
  | 'INCOMING_DAMAGE_PERCENT'
  | 'INCOMING_HEAL_PERCENT'
  | 'INFLUENCE_RECEIVED'
  | 'INFLUENCE_WORTH'
  | 'INITIATIVE'
  | 'INTELLIGENCE'
  | 'INTERACT_TIME'
  | 'LEVITATION_HEIGHT'
  | 'LOOT_CHANCE'
  | 'MAGIC_CRIT_RATE'
  | 'MAGIC_POWER'
  | 'MASTERY_1_BONUS'
  | 'MASTERY_2_BONUS'
  | 'MASTERY_3_BONUS'
  | 'MAX_ACTION_POINTS'
  | 'MELEE_CRIT_RATE'
  | 'MELEE_POWER'
  | 'MINIMUM_RANGE'
  | 'MONETARY_WORTH'
  | 'MORALE_REGEN'
  | 'OFFHAND_DAMAGE'
  | 'OFFHAND_PROC_CHANCE'
  | 'OUTGOING_DAMAGE'
  | 'OUTGOING_DAMAGE_PERCENT'
  | 'OUTGOING_HEAL_PERCENT'
  | 'PARRY'
  | 'PARRY_STRIKETHROUGH'
  | 'RADIUS'
  | 'RANGE'
  | 'RANGED_CRIT_RATE'
  | 'RANGED_POWER'
  | 'RENOWN_RECEIVED'
  | 'RENOWN_WORTH'
  | 'SALVAGING'
  | 'SCAVENGING'
  | 'SETBACK_CHANCE'
  | 'SETBACK_VALUE'
  | 'SPECIALIZATION'
  | 'SPIRIT_RESISTANCE'
  | 'STEALTH'
  | 'STEALTH_DETECTION'
  | 'STRENGTH'
  | 'TALISMAN_MAKING'
  | 'TARGET_DURATION'
  | 'TOUGHNESS'
  | 'VELOCITY'
  | 'WEAPON_SKILL'
  | 'WILLPOWER'
  | 'WOUNDS'
  | 'XP_RECEIVED'
  | 'XP_WORTH';

export type StringOperationFilterInput = {
  readonly and?: InputMaybe<ReadonlyArray<StringOperationFilterInput>>;
  readonly contains?: InputMaybe<Scalars['String']['input']>;
  readonly endsWith?: InputMaybe<Scalars['String']['input']>;
  readonly eq?: InputMaybe<Scalars['String']['input']>;
  readonly in?: InputMaybe<ReadonlyArray<InputMaybe<Scalars['String']['input']>>>;
  readonly ncontains?: InputMaybe<Scalars['String']['input']>;
  readonly nendsWith?: InputMaybe<Scalars['String']['input']>;
  readonly neq?: InputMaybe<Scalars['String']['input']>;
  readonly nin?: InputMaybe<ReadonlyArray<InputMaybe<Scalars['String']['input']>>>;
  readonly nstartsWith?: InputMaybe<Scalars['String']['input']>;
  readonly or?: InputMaybe<ReadonlyArray<StringOperationFilterInput>>;
  readonly startsWith?: InputMaybe<Scalars['String']['input']>;
};

export type TomeHelpType =
  | 'ADVANCED_HELP'
  | 'BEGINNER_HELP'
  | 'GAMEPLAY_HELP'
  | 'NONE'
  | 'UI_HELP';

export type TomeHelpTypeOperationFilterInput = {
  readonly eq?: InputMaybe<TomeHelpType>;
  readonly in?: InputMaybe<ReadonlyArray<TomeHelpType>>;
  readonly neq?: InputMaybe<TomeHelpType>;
  readonly nin?: InputMaybe<ReadonlyArray<TomeHelpType>>;
};

/** A connection to a list of items. */
export type TomeOfKnowledgeAchievementEntriesConnection = {
  readonly __typename?: 'TomeOfKnowledgeAchievementEntriesConnection';
  /** A list of edges. */
  readonly edges?: Maybe<ReadonlyArray<TomeOfKnowledgeAchievementEntriesEdge>>;
  /** A flattened list of the nodes. */
  readonly nodes?: Maybe<ReadonlyArray<TomeOfKnowledgeAchievementEntry>>;
  /** Information to aid in pagination. */
  readonly pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  readonly totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type TomeOfKnowledgeAchievementEntriesEdge = {
  readonly __typename?: 'TomeOfKnowledgeAchievementEntriesEdge';
  /** A cursor for use in pagination. */
  readonly cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  readonly node: TomeOfKnowledgeAchievementEntry;
};

export type TomeOfKnowledgeAchievementEntry = {
  readonly __typename?: 'TomeOfKnowledgeAchievementEntry';
  readonly description: Scalars['String']['output'];
  readonly id: Scalars['ID']['output'];
  readonly name: Scalars['String']['output'];
  readonly rewards: ReadonlyArray<TomeOfKnowledgeAchievementReward>;
  readonly subType: TomeOfKnowledgeAchievementSubType;
};

export type TomeOfKnowledgeAchievementEntryFilterInput = {
  readonly and?: InputMaybe<ReadonlyArray<TomeOfKnowledgeAchievementEntryFilterInput>>;
  /** Name */
  readonly description?: InputMaybe<StringOperationFilterInput>;
  readonly or?: InputMaybe<ReadonlyArray<TomeOfKnowledgeAchievementEntryFilterInput>>;
  /** SubType */
  readonly tomeAchievementSubTypeId?: InputMaybe<UnsignedIntOperationFilterInputType>;
};

export type TomeOfKnowledgeAchievementReward = {
  readonly id: Scalars['ID']['output'];
};

export type TomeOfKnowledgeAchievementRewardActionCounter = TomeOfKnowledgeAchievementReward & {
  readonly __typename?: 'TomeOfKnowledgeAchievementRewardActionCounter';
  /** Ability Info */
  readonly ability: AbilityInfo;
  readonly id: Scalars['ID']['output'];
};

export type TomeOfKnowledgeAchievementRewardItem = TomeOfKnowledgeAchievementReward & {
  readonly __typename?: 'TomeOfKnowledgeAchievementRewardItem';
  /** Item is automatically added to player inventory */
  readonly autoCreate: Scalars['Boolean']['output'];
  readonly id: Scalars['ID']['output'];
  /** Item info */
  readonly item: Item;
};

export type TomeOfKnowledgeAchievementRewardTitle = TomeOfKnowledgeAchievementReward & {
  readonly __typename?: 'TomeOfKnowledgeAchievementRewardTitle';
  readonly id: Scalars['ID']['output'];
  /** Tome of Knowledge entry */
  readonly title: TomeOfKnowledgeEntry;
};

export type TomeOfKnowledgeAchievementSubType = {
  readonly __typename?: 'TomeOfKnowledgeAchievementSubType';
  readonly description: Scalars['String']['output'];
  readonly entries: ReadonlyArray<TomeOfKnowledgeAchievementEntry>;
  readonly id: Scalars['ID']['output'];
  readonly name: Scalars['String']['output'];
  readonly type: TomeOfKnowledgeAchievementType;
};

export type TomeOfKnowledgeAchievementType = {
  readonly __typename?: 'TomeOfKnowledgeAchievementType';
  readonly id: Scalars['ID']['output'];
  readonly name: Scalars['String']['output'];
  readonly subTypes: ReadonlyArray<TomeOfKnowledgeAchievementSubType>;
};

/** A connection to a list of items. */
export type TomeOfKnowledgeEntriesConnection = {
  readonly __typename?: 'TomeOfKnowledgeEntriesConnection';
  /** A list of edges. */
  readonly edges?: Maybe<ReadonlyArray<TomeOfKnowledgeEntriesEdge>>;
  /** A flattened list of the nodes. */
  readonly nodes?: Maybe<ReadonlyArray<TomeOfKnowledgeEntry>>;
  /** Information to aid in pagination. */
  readonly pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  readonly totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type TomeOfKnowledgeEntriesEdge = {
  readonly __typename?: 'TomeOfKnowledgeEntriesEdge';
  /** A cursor for use in pagination. */
  readonly cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  readonly node: TomeOfKnowledgeEntry;
};

export type TomeOfKnowledgeEntry = SearchContent & {
  readonly __typename?: 'TomeOfKnowledgeEntry';
  readonly description: Scalars['String']['output'];
  readonly id: Scalars['ID']['output'];
  readonly name: Scalars['String']['output'];
  readonly realm: Realm;
  readonly xp: Scalars['UnsignedInt']['output'];
};

export type TomeOfKnowledgeEntryFilterInput = {
  readonly and?: InputMaybe<ReadonlyArray<TomeOfKnowledgeEntryFilterInput>>;
  /** Description */
  readonly description?: InputMaybe<StringOperationFilterInput>;
  readonly or?: InputMaybe<ReadonlyArray<TomeOfKnowledgeEntryFilterInput>>;
  /** Realm */
  readonly realm?: InputMaybe<RealmsOperationFilterInput>;
  /** Tome of Knowledge section */
  readonly tomeSection?: InputMaybe<NullableOfTomeSectionOperationFilterInput>;
  /** Type */
  readonly type?: InputMaybe<TomeHelpTypeOperationFilterInput>;
  /** XP reward */
  readonly xp?: InputMaybe<UnsignedIntOperationFilterInputType>;
};

/** Tome Of Knowledge sections */
export type TomeOfKnowledgeSection =
  | 'ACHIEVEMENTS'
  | 'BESTIARY'
  | 'GAME_FAQ'
  | 'GAME_MANUAL'
  | 'HELP'
  | 'HISTORY_AND_LORE'
  | 'LIVE_EVENT'
  | 'NOTEWORTHY_PERSONS'
  | 'OLD_WORLD_ARMORY'
  | 'PLAYER_TITLES'
  | 'TACTICS'
  | 'WARD'
  | 'WAR_JOURNAL'
  | 'ZONE_MAPS';

export type TradeSkill =
  | 'APOTHECARY'
  | 'BUTCHERING'
  | 'CULTIVATION'
  | 'NONE'
  | 'SALVAGING'
  | 'SCAVENGING'
  | 'TALISMAN_MAKING';

export type UnsignedIntOperationFilterInputType = {
  readonly eq?: InputMaybe<Scalars['UnsignedInt']['input']>;
  readonly gt?: InputMaybe<Scalars['UnsignedInt']['input']>;
  readonly gte?: InputMaybe<Scalars['UnsignedInt']['input']>;
  readonly in?: InputMaybe<ReadonlyArray<InputMaybe<Scalars['UnsignedInt']['input']>>>;
  readonly lt?: InputMaybe<Scalars['UnsignedInt']['input']>;
  readonly lte?: InputMaybe<Scalars['UnsignedInt']['input']>;
  readonly neq?: InputMaybe<Scalars['UnsignedInt']['input']>;
  readonly ngt?: InputMaybe<Scalars['UnsignedInt']['input']>;
  readonly ngte?: InputMaybe<Scalars['UnsignedInt']['input']>;
  readonly nin?: InputMaybe<ReadonlyArray<InputMaybe<Scalars['UnsignedInt']['input']>>>;
  readonly nlt?: InputMaybe<Scalars['UnsignedInt']['input']>;
  readonly nlte?: InputMaybe<Scalars['UnsignedInt']['input']>;
};

export type UnsignedLongOperationFilterInputType = {
  readonly eq?: InputMaybe<Scalars['UnsignedLong']['input']>;
  readonly gt?: InputMaybe<Scalars['UnsignedLong']['input']>;
  readonly gte?: InputMaybe<Scalars['UnsignedLong']['input']>;
  readonly in?: InputMaybe<ReadonlyArray<InputMaybe<Scalars['UnsignedLong']['input']>>>;
  readonly lt?: InputMaybe<Scalars['UnsignedLong']['input']>;
  readonly lte?: InputMaybe<Scalars['UnsignedLong']['input']>;
  readonly neq?: InputMaybe<Scalars['UnsignedLong']['input']>;
  readonly ngt?: InputMaybe<Scalars['UnsignedLong']['input']>;
  readonly ngte?: InputMaybe<Scalars['UnsignedLong']['input']>;
  readonly nin?: InputMaybe<ReadonlyArray<InputMaybe<Scalars['UnsignedLong']['input']>>>;
  readonly nlt?: InputMaybe<Scalars['UnsignedLong']['input']>;
  readonly nlte?: InputMaybe<Scalars['UnsignedLong']['input']>;
};

export type UnsignedShortOperationFilterInputType = {
  readonly eq?: InputMaybe<Scalars['UnsignedShort']['input']>;
  readonly gt?: InputMaybe<Scalars['UnsignedShort']['input']>;
  readonly gte?: InputMaybe<Scalars['UnsignedShort']['input']>;
  readonly in?: InputMaybe<ReadonlyArray<InputMaybe<Scalars['UnsignedShort']['input']>>>;
  readonly lt?: InputMaybe<Scalars['UnsignedShort']['input']>;
  readonly lte?: InputMaybe<Scalars['UnsignedShort']['input']>;
  readonly neq?: InputMaybe<Scalars['UnsignedShort']['input']>;
  readonly ngt?: InputMaybe<Scalars['UnsignedShort']['input']>;
  readonly ngte?: InputMaybe<Scalars['UnsignedShort']['input']>;
  readonly nin?: InputMaybe<ReadonlyArray<InputMaybe<Scalars['UnsignedShort']['input']>>>;
  readonly nlt?: InputMaybe<Scalars['UnsignedShort']['input']>;
  readonly nlte?: InputMaybe<Scalars['UnsignedShort']['input']>;
};

/** A connection to a list of items. */
export type UsedToPurchaseConnection = {
  readonly __typename?: 'UsedToPurchaseConnection';
  /** A list of edges. */
  readonly edges?: Maybe<ReadonlyArray<UsedToPurchaseEdge>>;
  /** A flattened list of the nodes. */
  readonly nodes?: Maybe<ReadonlyArray<VendorItem>>;
  /** Information to aid in pagination. */
  readonly pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  readonly totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type UsedToPurchaseEdge = {
  readonly __typename?: 'UsedToPurchaseEdge';
  /** A cursor for use in pagination. */
  readonly cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  readonly node: VendorItem;
};

export type UuidOperationFilterInput = {
  readonly eq?: InputMaybe<Scalars['UUID']['input']>;
  readonly gt?: InputMaybe<Scalars['UUID']['input']>;
  readonly gte?: InputMaybe<Scalars['UUID']['input']>;
  readonly in?: InputMaybe<ReadonlyArray<InputMaybe<Scalars['UUID']['input']>>>;
  readonly lt?: InputMaybe<Scalars['UUID']['input']>;
  readonly lte?: InputMaybe<Scalars['UUID']['input']>;
  readonly neq?: InputMaybe<Scalars['UUID']['input']>;
  readonly ngt?: InputMaybe<Scalars['UUID']['input']>;
  readonly ngte?: InputMaybe<Scalars['UUID']['input']>;
  readonly nin?: InputMaybe<ReadonlyArray<InputMaybe<Scalars['UUID']['input']>>>;
  readonly nlt?: InputMaybe<Scalars['UUID']['input']>;
  readonly nlte?: InputMaybe<Scalars['UUID']['input']>;
};

export type VendorItem = {
  readonly __typename?: 'VendorItem';
  readonly count: Scalars['UnsignedShort']['output'];
  readonly creatures: ReadonlyArray<Creature>;
  readonly item: Item;
  /** Cost in copper coins */
  readonly price: Scalars['UnsignedInt']['output'];
  readonly requiredItems: ReadonlyArray<VendorItemRequiredItem>;
  readonly soldBy: ReadonlyArray<Creature>;
};

export type VendorItemRequiredItem = {
  readonly __typename?: 'VendorItemRequiredItem';
  /** Amount needed */
  readonly count: Scalars['UnsignedShort']['output'];
  readonly item: Item;
};

/** A connection to a list of items. */
export type VendorItemsConnection = {
  readonly __typename?: 'VendorItemsConnection';
  /** A list of edges. */
  readonly edges?: Maybe<ReadonlyArray<VendorItemsEdge>>;
  /** A flattened list of the nodes. */
  readonly nodes?: Maybe<ReadonlyArray<VendorItem>>;
  /** Information to aid in pagination. */
  readonly pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  readonly totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type VendorItemsEdge = {
  readonly __typename?: 'VendorItemsEdge';
  /** A cursor for use in pagination. */
  readonly cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  readonly node: VendorItem;
};

/** Holds information about one attacker in a kill */
export type Victim = {
  readonly __typename?: 'Victim';
  /** Character information */
  readonly character: Character;
  /** Guild at the time of the kill */
  readonly guild?: Maybe<Guild>;
  /** Level at the time of the kill */
  readonly level: Scalars['Byte']['output'];
  /** Renown rank at the time of the kill */
  readonly renownRank: Scalars['Byte']['output'];
};

/** Activities in a War Journal entry */
export type WarJournalActivity = {
  readonly __typename?: 'WarJournalActivity';
  readonly activityType: Scalars['String']['output'];
  readonly id: Scalars['ID']['output'];
  /** Name of the activity */
  readonly name: Scalars['String']['output'];
  readonly tasks: ReadonlyArray<WarJournalActivityTask>;
  readonly text: Scalars['String']['output'];
  readonly zone?: Maybe<Zone>;
};

/** Tasks in a War Journal activity */
export type WarJournalActivityTask = {
  readonly __typename?: 'WarJournalActivityTask';
  readonly name: Scalars['String']['output'];
  readonly text: Scalars['String']['output'];
};

/** Entries in the War Journal */
export type WarJournalEntry = {
  readonly __typename?: 'WarJournalEntry';
  readonly activities: ReadonlyArray<WarJournalActivity>;
  readonly area?: Maybe<ZoneArea>;
  readonly id: Scalars['ID']['output'];
  readonly influenceRewards: ReadonlyArray<ChapterInfluenceReward>;
  readonly isRvR: Scalars['Boolean']['output'];
  readonly locationText?: Maybe<Scalars['String']['output']>;
  readonly name: Scalars['String']['output'];
  readonly npcName?: Maybe<Scalars['String']['output']>;
  readonly position?: Maybe<Position>;
  readonly shortTitle?: Maybe<Scalars['String']['output']>;
  readonly storyline: WarJournalStoryline;
  readonly text?: Maybe<Scalars['String']['output']>;
  readonly title?: Maybe<Scalars['String']['output']>;
  readonly zone?: Maybe<Zone>;
};

export type WarJournalEntryFilterInput = {
  readonly and?: InputMaybe<ReadonlyArray<WarJournalEntryFilterInput>>;
  readonly areaId?: InputMaybe<UnsignedShortOperationFilterInputType>;
  readonly isRvR?: InputMaybe<BooleanOperationFilterInput>;
  /** Name of the entry */
  readonly name?: InputMaybe<StringOperationFilterInput>;
  readonly or?: InputMaybe<ReadonlyArray<WarJournalEntryFilterInput>>;
  readonly storylineId?: InputMaybe<UnsignedIntOperationFilterInputType>;
  readonly zoneId?: InputMaybe<UnsignedShortOperationFilterInputType>;
};

/** Storylines in the War Journal */
export type WarJournalStoryline = {
  readonly __typename?: 'WarJournalStoryline';
  readonly entries: ReadonlyArray<WarJournalEntry>;
  readonly id: Scalars['ID']['output'];
  /** Name of the storyline */
  readonly name: Scalars['String']['output'];
  readonly summary: Scalars['String']['output'];
};

export type WarJournalStorylineFilterInput = {
  readonly and?: InputMaybe<ReadonlyArray<WarJournalStorylineFilterInput>>;
  /** Name of the storyline */
  readonly name?: InputMaybe<StringOperationFilterInput>;
  readonly or?: InputMaybe<ReadonlyArray<WarJournalStorylineFilterInput>>;
};

export type ZandriExpeditionEvent = Event & {
  readonly __typename?: 'ZandriExpeditionEvent';
  readonly endTime?: Maybe<Scalars['DateTime']['output']>;
  readonly name: Scalars['String']['output'];
  readonly startTime: Scalars['DateTime']['output'];
};

export type Zone = SearchContent & {
  readonly __typename?: 'Zone';
  /** The unique id of the zone */
  readonly id: Scalars['ID']['output'];
  /** The map setup of the zone */
  readonly mapSetup?: Maybe<MapSetup>;
  /** The name of the zone */
  readonly name: Scalars['String']['output'];
};

export type ZoneArea = {
  readonly __typename?: 'ZoneArea';
  /** The unique id of the zone area */
  readonly id: Scalars['ID']['output'];
  /** The map setup of the zone area */
  readonly mapSetup?: Maybe<MapSetup>;
  /** The name of the zone area */
  readonly name?: Maybe<Scalars['String']['output']>;
  /** Zone information */
  readonly zone: Zone;
};

export type ZoneType =
  | 'INSTANCE'
  | 'NORMAL'
  | 'SCENARIO';

export type GetCharacterQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetCharacterQuery = { readonly __typename?: 'Query', readonly character?: { readonly __typename?: 'Character', readonly id: string, readonly name: string, readonly level: any, readonly renownRank: any, readonly career: Career, readonly items: ReadonlyArray<{ readonly __typename?: 'CharacterItem', readonly equipSlot: EquipSlot, readonly item: { readonly __typename?: 'Item', readonly id: string, readonly name: string, readonly description: string, readonly type: ItemType, readonly slot: EquipSlot, readonly rarity: ItemRarity, readonly armor: any, readonly dps: any, readonly speed: any, readonly levelRequirement: any, readonly renownRankRequirement: any, readonly itemLevel: any, readonly uniqueEquipped: boolean, readonly careerRestriction: ReadonlyArray<Career>, readonly raceRestriction: ReadonlyArray<Race>, readonly iconUrl: any, readonly talismanSlots: any, readonly stats: ReadonlyArray<{ readonly __typename?: 'ItemStat', readonly stat: Stat, readonly value: any, readonly percentage: boolean }>, readonly itemSet?: { readonly __typename?: 'ItemSet', readonly id: string, readonly name: string, readonly bonuses: ReadonlyArray<{ readonly __typename?: 'ItemSetBonus', readonly itemsRequired: any, readonly bonus:
              | { readonly __typename: 'Ability', readonly name?: string | null, readonly description?: string | null }
              | { readonly __typename: 'ItemStat', readonly stat: Stat, readonly value: any, readonly percentage: boolean }
             }> } | null, readonly abilities: ReadonlyArray<{ readonly __typename?: 'Ability', readonly name?: string | null }>, readonly buffs: ReadonlyArray<{ readonly __typename?: 'Ability', readonly name?: string | null }> }, readonly talismans: ReadonlyArray<{ readonly __typename?: 'Item', readonly id: string, readonly name: string, readonly description: string, readonly type: ItemType, readonly slot: EquipSlot, readonly rarity: ItemRarity, readonly armor: any, readonly dps: any, readonly speed: any, readonly levelRequirement: any, readonly renownRankRequirement: any, readonly itemLevel: any, readonly uniqueEquipped: boolean, readonly careerRestriction: ReadonlyArray<Career>, readonly raceRestriction: ReadonlyArray<Race>, readonly iconUrl: any, readonly talismanSlots: any, readonly stats: ReadonlyArray<{ readonly __typename?: 'ItemStat', readonly stat: Stat, readonly value: any, readonly percentage: boolean }>, readonly itemSet?: { readonly __typename?: 'ItemSet', readonly id: string, readonly name: string, readonly bonuses: ReadonlyArray<{ readonly __typename?: 'ItemSetBonus', readonly itemsRequired: any, readonly bonus:
              | { readonly __typename: 'Ability', readonly name?: string | null, readonly description?: string | null }
              | { readonly __typename: 'ItemStat', readonly stat: Stat, readonly value: any, readonly percentage: boolean }
             }> } | null }> }> } | null };

export type GetCharactersQueryVariables = Exact<{
  name: Scalars['String']['input'];
}>;


export type GetCharactersQuery = { readonly __typename?: 'Query', readonly characters?: { readonly __typename?: 'CharactersConnection', readonly edges?: ReadonlyArray<{ readonly __typename?: 'CharactersEdge', readonly node: { readonly __typename?: 'Character', readonly id: string, readonly name: string, readonly career: Career, readonly level: any, readonly renownRank: any } }> | null } | null };

export type GetItemQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetItemQuery = { readonly __typename?: 'Query', readonly item?: { readonly __typename?: 'Item', readonly id: string, readonly name: string, readonly description: string, readonly type: ItemType, readonly slot: EquipSlot, readonly rarity: ItemRarity, readonly armor: any, readonly dps: any, readonly speed: any, readonly levelRequirement: any, readonly renownRankRequirement: any, readonly itemLevel: any, readonly uniqueEquipped: boolean, readonly careerRestriction: ReadonlyArray<Career>, readonly raceRestriction: ReadonlyArray<Race>, readonly iconUrl: any, readonly talismanSlots: any, readonly stats: ReadonlyArray<{ readonly __typename?: 'ItemStat', readonly stat: Stat, readonly value: any, readonly percentage: boolean }>, readonly itemSet?: { readonly __typename?: 'ItemSet', readonly id: string, readonly name: string, readonly bonuses: ReadonlyArray<{ readonly __typename?: 'ItemSetBonus', readonly itemsRequired: any, readonly bonus:
          | { readonly __typename: 'Ability', readonly name?: string | null, readonly description?: string | null }
          | { readonly __typename: 'ItemStat', readonly stat: Stat, readonly value: any, readonly percentage: boolean }
         }> } | null, readonly abilities: ReadonlyArray<{ readonly __typename?: 'Ability', readonly name?: string | null, readonly description?: string | null }>, readonly buffs: ReadonlyArray<{ readonly __typename?: 'Ability', readonly name?: string | null, readonly description?: string | null }> } | null };

export type GetPocketItemsQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  hasStats?: InputMaybe<ReadonlyArray<Stat> | Stat>;
  usableByCareer?: InputMaybe<Career>;
  where?: InputMaybe<ItemFilterInput>;
}>;


export type GetPocketItemsQuery = { readonly __typename?: 'Query', readonly items?: { readonly __typename?: 'ItemsConnection', readonly totalCount: number, readonly pageInfo: { readonly __typename?: 'PageInfo', readonly hasNextPage: boolean, readonly hasPreviousPage: boolean, readonly startCursor?: string | null, readonly endCursor?: string | null }, readonly edges?: ReadonlyArray<{ readonly __typename?: 'ItemsEdge', readonly cursor: string, readonly node: { readonly __typename?: 'Item', readonly id: string, readonly name: string, readonly type: ItemType, readonly slot: EquipSlot, readonly rarity: ItemRarity, readonly armor: any, readonly dps: any, readonly speed: any, readonly levelRequirement: any, readonly renownRankRequirement: any, readonly itemLevel: any, readonly uniqueEquipped: boolean, readonly careerRestriction: ReadonlyArray<Career>, readonly raceRestriction: ReadonlyArray<Race>, readonly iconUrl: any, readonly talismanSlots: any, readonly stats: ReadonlyArray<{ readonly __typename?: 'ItemStat', readonly stat: Stat, readonly value: any, readonly percentage: boolean }>, readonly itemSet?: { readonly __typename?: 'ItemSet', readonly id: string, readonly name: string } | null } }> | null, readonly nodes?: ReadonlyArray<{ readonly __typename?: 'Item', readonly id: string, readonly name: string, readonly type: ItemType, readonly slot: EquipSlot, readonly rarity: ItemRarity, readonly armor: any, readonly dps: any, readonly speed: any, readonly levelRequirement: any, readonly renownRankRequirement: any, readonly itemLevel: any, readonly uniqueEquipped: boolean, readonly careerRestriction: ReadonlyArray<Career>, readonly raceRestriction: ReadonlyArray<Race>, readonly iconUrl: any, readonly talismanSlots: any, readonly stats: ReadonlyArray<{ readonly __typename?: 'ItemStat', readonly stat: Stat, readonly value: any, readonly percentage: boolean }>, readonly itemSet?: { readonly __typename?: 'ItemSet', readonly id: string, readonly name: string } | null }> | null } | null };

export type GetTalismansQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  hasStats?: InputMaybe<ReadonlyArray<Stat> | Stat>;
  where?: InputMaybe<ItemFilterInput>;
}>;


export type GetTalismansQuery = { readonly __typename?: 'Query', readonly items?: { readonly __typename?: 'ItemsConnection', readonly totalCount: number, readonly pageInfo: { readonly __typename?: 'PageInfo', readonly hasNextPage: boolean, readonly hasPreviousPage: boolean, readonly startCursor?: string | null, readonly endCursor?: string | null }, readonly edges?: ReadonlyArray<{ readonly __typename?: 'ItemsEdge', readonly cursor: string, readonly node: { readonly __typename?: 'Item', readonly id: string, readonly name: string, readonly type: ItemType, readonly slot: EquipSlot, readonly rarity: ItemRarity, readonly armor: any, readonly dps: any, readonly speed: any, readonly levelRequirement: any, readonly renownRankRequirement: any, readonly itemLevel: any, readonly uniqueEquipped: boolean, readonly careerRestriction: ReadonlyArray<Career>, readonly raceRestriction: ReadonlyArray<Race>, readonly iconUrl: any, readonly talismanSlots: any, readonly stats: ReadonlyArray<{ readonly __typename?: 'ItemStat', readonly stat: Stat, readonly value: any, readonly percentage: boolean }>, readonly itemSet?: { readonly __typename?: 'ItemSet', readonly id: string, readonly name: string } | null } }> | null, readonly nodes?: ReadonlyArray<{ readonly __typename?: 'Item', readonly id: string, readonly name: string, readonly type: ItemType, readonly slot: EquipSlot, readonly rarity: ItemRarity, readonly armor: any, readonly dps: any, readonly speed: any, readonly levelRequirement: any, readonly renownRankRequirement: any, readonly itemLevel: any, readonly uniqueEquipped: boolean, readonly careerRestriction: ReadonlyArray<Career>, readonly raceRestriction: ReadonlyArray<Race>, readonly iconUrl: any, readonly talismanSlots: any, readonly stats: ReadonlyArray<{ readonly __typename?: 'ItemStat', readonly stat: Stat, readonly value: any, readonly percentage: boolean }>, readonly itemSet?: { readonly __typename?: 'ItemSet', readonly id: string, readonly name: string } | null }> | null } | null };


export const GetCharacterDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCharacter"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"character"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"renownRank"}},{"kind":"Field","name":{"kind":"Name","value":"career"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"equipSlot"}},{"kind":"Field","name":{"kind":"Name","value":"item"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"slot"}},{"kind":"Field","name":{"kind":"Name","value":"rarity"}},{"kind":"Field","name":{"kind":"Name","value":"armor"}},{"kind":"Field","name":{"kind":"Name","value":"dps"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}},{"kind":"Field","name":{"kind":"Name","value":"levelRequirement"}},{"kind":"Field","name":{"kind":"Name","value":"renownRankRequirement"}},{"kind":"Field","name":{"kind":"Name","value":"itemLevel"}},{"kind":"Field","name":{"kind":"Name","value":"uniqueEquipped"}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stat"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"percentage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"careerRestriction"}},{"kind":"Field","name":{"kind":"Name","value":"raceRestriction"}},{"kind":"Field","name":{"kind":"Name","value":"iconUrl"}},{"kind":"Field","name":{"kind":"Name","value":"talismanSlots"}},{"kind":"Field","name":{"kind":"Name","value":"itemSet"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"bonuses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"itemsRequired"}},{"kind":"Field","name":{"kind":"Name","value":"bonus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ItemStat"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stat"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"percentage"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Ability"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"abilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"buffs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"talismans"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"slot"}},{"kind":"Field","name":{"kind":"Name","value":"rarity"}},{"kind":"Field","name":{"kind":"Name","value":"armor"}},{"kind":"Field","name":{"kind":"Name","value":"dps"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}},{"kind":"Field","name":{"kind":"Name","value":"levelRequirement"}},{"kind":"Field","name":{"kind":"Name","value":"renownRankRequirement"}},{"kind":"Field","name":{"kind":"Name","value":"itemLevel"}},{"kind":"Field","name":{"kind":"Name","value":"uniqueEquipped"}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stat"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"percentage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"careerRestriction"}},{"kind":"Field","name":{"kind":"Name","value":"raceRestriction"}},{"kind":"Field","name":{"kind":"Name","value":"iconUrl"}},{"kind":"Field","name":{"kind":"Name","value":"talismanSlots"}},{"kind":"Field","name":{"kind":"Name","value":"itemSet"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"bonuses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"itemsRequired"}},{"kind":"Field","name":{"kind":"Name","value":"bonus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ItemStat"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stat"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"percentage"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Ability"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetCharacterQuery, GetCharacterQueryVariables>;
export const GetCharactersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCharacters"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"characters"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"name"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}]}}]}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"career"}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"renownRank"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetCharactersQuery, GetCharactersQueryVariables>;
export const GetItemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetItem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"item"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"slot"}},{"kind":"Field","name":{"kind":"Name","value":"rarity"}},{"kind":"Field","name":{"kind":"Name","value":"armor"}},{"kind":"Field","name":{"kind":"Name","value":"dps"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}},{"kind":"Field","name":{"kind":"Name","value":"levelRequirement"}},{"kind":"Field","name":{"kind":"Name","value":"renownRankRequirement"}},{"kind":"Field","name":{"kind":"Name","value":"itemLevel"}},{"kind":"Field","name":{"kind":"Name","value":"uniqueEquipped"}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stat"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"percentage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"careerRestriction"}},{"kind":"Field","name":{"kind":"Name","value":"raceRestriction"}},{"kind":"Field","name":{"kind":"Name","value":"iconUrl"}},{"kind":"Field","name":{"kind":"Name","value":"talismanSlots"}},{"kind":"Field","name":{"kind":"Name","value":"itemSet"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"bonuses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"itemsRequired"}},{"kind":"Field","name":{"kind":"Name","value":"bonus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ItemStat"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stat"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"percentage"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Ability"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"abilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"buffs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]} as unknown as DocumentNode<GetItemQuery, GetItemQueryVariables>;
export const GetPocketItemsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPocketItems"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"last"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"before"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"hasStats"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Stat"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"usableByCareer"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Career"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ItemFilterInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"hasStats"},"value":{"kind":"Variable","name":{"kind":"Name","value":"hasStats"}}},{"kind":"Argument","name":{"kind":"Name","value":"usableByCareer"},"value":{"kind":"Variable","name":{"kind":"Name","value":"usableByCareer"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"last"},"value":{"kind":"Variable","name":{"kind":"Name","value":"last"}}},{"kind":"Argument","name":{"kind":"Name","value":"before"},"value":{"kind":"Variable","name":{"kind":"Name","value":"before"}}},{"kind":"Argument","name":{"kind":"Name","value":"order"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"rarity"},"value":{"kind":"EnumValue","value":"DESC"}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"itemLevel"},"value":{"kind":"EnumValue","value":"DESC"}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"dps"},"value":{"kind":"EnumValue","value":"DESC"}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"name"},"value":{"kind":"EnumValue","value":"ASC"}}]}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}},{"kind":"Field","name":{"kind":"Name","value":"startCursor"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"slot"}},{"kind":"Field","name":{"kind":"Name","value":"rarity"}},{"kind":"Field","name":{"kind":"Name","value":"armor"}},{"kind":"Field","name":{"kind":"Name","value":"dps"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}},{"kind":"Field","name":{"kind":"Name","value":"levelRequirement"}},{"kind":"Field","name":{"kind":"Name","value":"renownRankRequirement"}},{"kind":"Field","name":{"kind":"Name","value":"itemLevel"}},{"kind":"Field","name":{"kind":"Name","value":"uniqueEquipped"}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stat"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"percentage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"careerRestriction"}},{"kind":"Field","name":{"kind":"Name","value":"raceRestriction"}},{"kind":"Field","name":{"kind":"Name","value":"iconUrl"}},{"kind":"Field","name":{"kind":"Name","value":"talismanSlots"}},{"kind":"Field","name":{"kind":"Name","value":"itemSet"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"slot"}},{"kind":"Field","name":{"kind":"Name","value":"rarity"}},{"kind":"Field","name":{"kind":"Name","value":"armor"}},{"kind":"Field","name":{"kind":"Name","value":"dps"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}},{"kind":"Field","name":{"kind":"Name","value":"levelRequirement"}},{"kind":"Field","name":{"kind":"Name","value":"renownRankRequirement"}},{"kind":"Field","name":{"kind":"Name","value":"itemLevel"}},{"kind":"Field","name":{"kind":"Name","value":"uniqueEquipped"}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stat"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"percentage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"careerRestriction"}},{"kind":"Field","name":{"kind":"Name","value":"raceRestriction"}},{"kind":"Field","name":{"kind":"Name","value":"iconUrl"}},{"kind":"Field","name":{"kind":"Name","value":"talismanSlots"}},{"kind":"Field","name":{"kind":"Name","value":"itemSet"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<GetPocketItemsQuery, GetPocketItemsQueryVariables>;
export const GetTalismansDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTalismans"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"last"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"before"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"hasStats"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Stat"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ItemFilterInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"hasStats"},"value":{"kind":"Variable","name":{"kind":"Name","value":"hasStats"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"last"},"value":{"kind":"Variable","name":{"kind":"Name","value":"last"}}},{"kind":"Argument","name":{"kind":"Name","value":"before"},"value":{"kind":"Variable","name":{"kind":"Name","value":"before"}}},{"kind":"Argument","name":{"kind":"Name","value":"order"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"rarity"},"value":{"kind":"EnumValue","value":"DESC"}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"itemLevel"},"value":{"kind":"EnumValue","value":"DESC"}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"dps"},"value":{"kind":"EnumValue","value":"DESC"}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"name"},"value":{"kind":"EnumValue","value":"ASC"}}]}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}},{"kind":"Field","name":{"kind":"Name","value":"startCursor"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"slot"}},{"kind":"Field","name":{"kind":"Name","value":"rarity"}},{"kind":"Field","name":{"kind":"Name","value":"armor"}},{"kind":"Field","name":{"kind":"Name","value":"dps"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}},{"kind":"Field","name":{"kind":"Name","value":"levelRequirement"}},{"kind":"Field","name":{"kind":"Name","value":"renownRankRequirement"}},{"kind":"Field","name":{"kind":"Name","value":"itemLevel"}},{"kind":"Field","name":{"kind":"Name","value":"uniqueEquipped"}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stat"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"percentage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"careerRestriction"}},{"kind":"Field","name":{"kind":"Name","value":"raceRestriction"}},{"kind":"Field","name":{"kind":"Name","value":"iconUrl"}},{"kind":"Field","name":{"kind":"Name","value":"talismanSlots"}},{"kind":"Field","name":{"kind":"Name","value":"itemSet"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"slot"}},{"kind":"Field","name":{"kind":"Name","value":"rarity"}},{"kind":"Field","name":{"kind":"Name","value":"armor"}},{"kind":"Field","name":{"kind":"Name","value":"dps"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}},{"kind":"Field","name":{"kind":"Name","value":"levelRequirement"}},{"kind":"Field","name":{"kind":"Name","value":"renownRankRequirement"}},{"kind":"Field","name":{"kind":"Name","value":"itemLevel"}},{"kind":"Field","name":{"kind":"Name","value":"uniqueEquipped"}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stat"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"percentage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"careerRestriction"}},{"kind":"Field","name":{"kind":"Name","value":"raceRestriction"}},{"kind":"Field","name":{"kind":"Name","value":"iconUrl"}},{"kind":"Field","name":{"kind":"Name","value":"talismanSlots"}},{"kind":"Field","name":{"kind":"Name","value":"itemSet"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<GetTalismansQuery, GetTalismansQueryVariables>;