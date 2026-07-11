import { ConstantItem } from "./types";

export const SCIENTIFIC_CONSTANTS: ConstantItem[] = [
  {
    name: "Speed of Light",
    symbol: "c",
    value: 299792458,
    unit: "m/s",
    description: "The speed of electromagnetic radiation in a vacuum."
  },
  {
    name: "Planck's Constant",
    symbol: "h",
    value: 6.62607015e-34,
    unit: "J·s",
    description: "Quantum of electromagnetic action relating energy to frequency."
  },
  {
    name: "Reduced Planck's Constant",
    symbol: "hbar",
    value: 1.054571817e-34,
    unit: "J·s",
    description: "Planck's constant divided by 2π."
  },
  {
    name: "Gravitational Constant",
    symbol: "G",
    value: 6.6743e-11,
    unit: "m³/(kg·s²)",
    description: "Empirical physical constant in Isaac Newton's law of universal gravitation."
  },
  {
    name: "Elementary Charge",
    symbol: "e",
    value: 1.602176634e-19,
    unit: "C",
    description: "The electrical charge carried by a single proton."
  },
  {
    name: "Boltzmann Constant",
    symbol: "k_B",
    value: 1.380649e-23,
    unit: "J/K",
    description: "Relates the average relative kinetic energy of particles in a gas with the temperature."
  },
  {
    name: "Universal Gas Constant",
    symbol: "R",
    value: 8.314462618,
    unit: "J/(mol·K)",
    description: "State constant in the ideal gas equation."
  },
  {
    name: "Avogadro's Constant",
    symbol: "N_A",
    value: 6.02214076e23,
    unit: "mol⁻¹",
    description: "Number of constituent particles in one mole of a substance."
  },
  {
    name: "Acceleration of Gravity",
    symbol: "g",
    value: 9.80665,
    unit: "m/s²",
    description: "Standard acceleration due to Earth's gravity."
  },
  {
    name: "Vacuum Permittivity",
    symbol: "epsilon_0",
    value: 8.8541878128e-12,
    unit: "F/m",
    description: "Capability of a vacuum to permit electric field lines."
  },
  {
    name: "Electronvolt",
    symbol: "eV",
    value: 1.602176634e-19,
    unit: "J",
    description: "Amount of kinetic energy gained by a single electron accelerating from rest through an electric potential difference of one volt."
  }
];

export interface FormulaTemplate {
  title: string;
  expression: string;
  description: string;
  category: string;
}

export const FORMULA_TEMPLATES: Record<string, FormulaTemplate[]> = {
  algebra: [
    {
      title: "Fermat's Last Theorem",
      expression: "a^n + b^n = c^n",
      description: "No non-trivial integer solutions exist for a, b, c when n > 2.",
      category: "Algebra"
    },
    {
      title: "Quadratic Polynomial",
      expression: "y = 1*x^2 - 4*x + 3",
      description: "Standard parabola featuring roots at x=1 and x=3.",
      category: "Algebra"
    },
    {
      title: "Damped Sine Wave",
      expression: "y = exp(-0.2*x) * sin(2*x)",
      description: "Decaying oscillation useful in engineering and physics.",
      category: "Calculus"
    },
    {
      title: "Cubic Extremum",
      expression: "y = x^3 - 3*x + 2",
      description: "Polynomial showing clean local maxima, minima, and inflection points.",
      category: "Algebra"
    },
    {
      title: "Rational Function (Asymptote)",
      expression: "y = (2*x + 1) / (x - 1)",
      description: "Function highlighting a vertical asymptote at x=1 and a horizontal asymptote at y=2.",
      category: "Algebra"
    }
  ],
  physics: [
    {
      title: "Kinetic Energy",
      expression: "E_k = 0.5 * m * v^2",
      description: "Energy possessed by an object due to its motion.",
      category: "Mechanics"
    },
    {
      title: "Newton's Gravitation Law",
      expression: "F = G * m1 * m2 / r^2",
      description: "Gravitational attractive force between two mass points.",
      category: "Mechanics"
    },
    {
      title: "Ideal Gas Law",
      expression: "P * V = n * R * T",
      description: "Equation of state of a hypothetical ideal gas.",
      category: "Thermodynamics"
    },
    {
      title: "Photon Energy",
      expression: "E = h * f",
      description: "Energy of a photon based on its frequency.",
      category: "Quantum Physics"
    }
  ],
  chemistry: [
    {
      title: "Combustion of Methane",
      expression: "CH4 + O2 -> CO2 + H2O",
      description: "Balance reactants and products of standard methane combustion.",
      category: "Balancing"
    },
    {
      title: "Photosynthesis Reaction",
      expression: "CO2 + H2O -> C6H12O6 + O2",
      description: "Balance conversion of carbon dioxide and water into glucose.",
      category: "Balancing"
    },
    {
      title: "Acid-Base Neutralization",
      expression: "HCl + NaOH -> NaCl + H2O",
      description: "Neutralization reaction of strong acid and strong base.",
      category: "Stoichiometry"
    },
    {
      title: "Radioactive Half-life Decay",
      expression: "N_t = N_0 * (0.5)^(t / 10)",
      description: "Calculates remaining substance after time t with half-life of 10 years.",
      category: "Kinetics"
    }
  ],
  matrix: [
    {
      title: "2x2 Linear Transformation",
      expression: "[[2, 1], [1, -3]]",
      description: "Simple 2x2 matrix for finding determinants, eigenvalues, and inverse.",
      category: "Matrix Math"
    },
    {
      title: "3x3 System Matrix",
      expression: "[[1, 2, -1], [2, 0, 1], [1, -1, 1]]",
      description: "3x3 matrix for linear coordinate mapping or system solving.",
      category: "Matrix Math"
    }
  ],
  statistics: [
    {
      title: "Linear Sample Dataset",
      expression: "x = [1, 2, 3, 4, 5, 6]\ny = [2.1, 4.3, 5.8, 8.2, 10.1, 11.9]",
      description: "Sample points with strong linear correlation.",
      category: "Regression"
    },
    {
      title: "Exponential Growth Dataset",
      expression: "x = [0, 1, 2, 3, 4, 5]\ny = [1.2, 2.3, 4.5, 9.1, 18.2, 36.5]",
      description: "Sample points representing exponential doubling.",
      category: "Regression"
    }
  ]
};
