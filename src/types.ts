export interface ConstantItem {
  name: string;
  symbol: string;
  value: number;
  unit: string;
  description: string;
}

export interface SolverStep {
  title: string;
  explanation: string;
  latex: string;
}

export interface KeyPoint {
  label: string;
  x: number;
  y: number;
}

export interface AlternateIsolation {
  variableName: string;
  isolatedFormulaLatex: string;
  isolatedFormulaMathJS: string;
}

export interface SolverResult {
  success: boolean;
  error?: string;
  latexExpression: string;
  independentVariable: string;
  dependentVariable: string;
  variables: string[];
  constants: { name: string; symbol: string; value: number; unit: string }[];
  steps: SolverStep[];
  finalAnswer: string;
  graphingFormula?: string;
  graphingKeyPoints?: KeyPoint[];
  alternateIsolations?: AlternateIsolation[];
}

export interface ChemistryMolarMass {
  substance: string;
  molarMass: number;
}

export interface ChemicalSubstance {
  formula: string;
  coefficient: number;
}

export interface ChemistryStep {
  title: string;
  explanation: string;
}

export interface ChemistryResult {
  success: boolean;
  error?: string;
  balancedReaction?: string;
  latexReaction?: string;
  molarMasses?: ChemistryMolarMass[];
  reactants?: ChemicalSubstance[];
  products?: ChemicalSubstance[];
  stoichiometrySteps?: string[];
  phValue?: number;
  steps: ChemistryStep[];
  finalExplanation: string;
}

export type SolverMode = 'algebra' | 'physics' | 'chemistry' | 'matrix' | 'statistics' | 'nlp';

export interface AttachedFile {
  name: string;
  mimeType: string;
  data: string; // Base64 encoded (without data:MIME;base64, prefix)
  size: number;
}

