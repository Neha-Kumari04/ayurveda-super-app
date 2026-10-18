export { useVoiceSearch } from './voice/useVoiceSearch';
export { createRecognizer, getSharedRecognizer } from './voice/recognizer';

export type {
  VoiceRecognitionState,
  VoiceRecognitionResult,
  VoiceRecognizer,
} from './voice/types';

export { useInteractionStore } from './recs/interactions';

export {
  personalisedForYou,
  similarityScore,
  similarItems,
  topRated,
  trending,
} from './recs/engine';

export type {
  InteractionProfile,
  RatedItem,
  CategorisedItem,
  SpecialisedItem,
} from './recs/engine';

export {
  useProductRecommendations,
  useDoctorRecommendations,
} from './recs/useRecommendations';
