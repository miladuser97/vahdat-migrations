// src/features/media/services/index.ts

export {
  createCandidate,
  createCandidates,
  toCreateCandidateInput,
  getCandidateById,
  getCandidatesForProduct,
} from "./candidate-service";

export type {
  CreateCandidateInput,
  CandidateResult,
  CreateCandidatesResult,
} from "./candidate-service";

export {
  searchAndPersistCandidates,
} from "./media-search-service";

export type {
  SearchAndPersistInput,
  SearchAndPersistResult,
} from "./media-search-service";