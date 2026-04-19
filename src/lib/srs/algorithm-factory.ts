import type { AlgorithmName, SRSAlgorithm } from "./types";
import { sm2Algorithm } from "./sm2-adapter";
import { leitner } from "./leitner";
import { fsrsAlgorithm } from "./fsrs";

const algorithms: Record<AlgorithmName, SRSAlgorithm> = {
  SM2: sm2Algorithm,
  LEITNER: leitner,
  FSRS: fsrsAlgorithm,
};

export function getAlgorithm(name: AlgorithmName): SRSAlgorithm {
  return algorithms[name];
}
