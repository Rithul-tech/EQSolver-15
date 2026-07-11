import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry User-Agent as required by the instruction
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper to check for API key
const checkApiKey = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is required but missing.");
  }
};

// 1. Math/Physics/General NLP Solving Endpoint
app.post("/api/solve", async (req, res) => {
  try {
    checkApiKey();
    const { query, mode, currentVariables, file } = req.body;

    if ((!query || typeof query !== "string" || !query.trim()) && !file) {
      return res.status(400).json({ error: "Query text or an uploaded file (image, PDF, document) must be provided." });
    }

    const systemInstruction = `You are EQSolver, an advanced symbolic and numerical mathematical, physical, and chemical reasoning model. 
Analyze the user's mathematical query, natural language word problem, or the uploaded image/PDF/document.
Solve it step-by-step, explaining the mathematical laws and scientific concepts applied.

Mode context: ${mode || "general"}
Current variable overrides: ${JSON.stringify(currentVariables || {})}

Return a highly detailed JSON structure matching the required schema. Ensure:
- 'latexExpression' is the mathematically correct LaTeX representation of the input equation (omit the outer equation symbols like $).
- 'independentVariable' is the primary independent variable (e.g., 'x' or 't').
- 'dependentVariable' is the primary dependent variable (e.g., 'y' or 'E').
- 'variables' lists all variables detected (e.g. ['x', 'y', 'a', 'b']).
- 'constants' lists any fundamental physical/chemical constants detected or related (e.g., speed of light c = 299792458 m/s, Planck h, gravity g = 9.81 m/s^2, etc.) or mathematical constants like pi, e.
- 'steps' provides a complete, granular, rigorous step-by-step mathematical reasoning. Each step must have a clear title, a plain-text description of the laws or algebra applied, and the LaTeX output at that step.
- 'finalAnswer' is the clear, human-readable final solution. Use LaTeX where appropriate.
- 'graphingFormula' is a clean mathjs-compatible explicit 1D function of the independent variable, e.g., "3*x^2 - 2*x + 5" or "sin(x)" or "exp(-x)", so the client can plot it as a function of the independent variable. Keep it purely algebraic (use * for multiplication, ^ for power, e.g. "a*x + b" where constants can be evaluated). If not plotable or 3D/matrix-only, leave it blank or provide a plotable 2D section.
- 'graphingKeyPoints' lists critical features (x, y) like roots (where y=0), y-intercepts (where x=0), local maxima/minima, asymptotes, or key points of interest. Include at least 2-4 points if possible.
- 'alternateIsolations' rearranges the core equation to isolate other detected variables (e.g., if kinetic energy formula is Ek = 0.5 * m * v^2, isolate m as '2*Ek/v^2' and v as 'sqrt(2*Ek/m)').

For physics/chemistry, make sure constants are correctly populated with names, values, symbols, and units. Do not leave the steps blank. Write rich explanations.`;

    let contents: any = `Query: "${query || ""}"`;
    if (file && file.data && file.mimeType) {
      contents = {
        parts: [
          {
            inlineData: {
              mimeType: file.mimeType,
              data: file.data
            }
          },
          {
            text: `Query: "${query || "Please extract, analyze, and solve the mathematical, physical, or chemical equation or word problem from this uploaded file/image."}"`
          }
        ]
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            success: { type: Type.BOOLEAN },
            error: { type: Type.STRING },
            latexExpression: { type: Type.STRING },
            independentVariable: { type: Type.STRING },
            dependentVariable: { type: Type.STRING },
            variables: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            constants: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  symbol: { type: Type.STRING },
                  value: { type: Type.NUMBER },
                  unit: { type: Type.STRING }
                },
                required: ["name", "symbol", "value", "unit"]
              }
            },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  latex: { type: Type.STRING }
                },
                required: ["title", "explanation", "latex"]
              }
            },
            finalAnswer: { type: Type.STRING },
            graphingFormula: { type: Type.STRING },
            graphingKeyPoints: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER }
                },
                required: ["label", "x", "y"]
              }
            },
            alternateIsolations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  variableName: { type: Type.STRING },
                  isolatedFormulaLatex: { type: Type.STRING },
                  isolatedFormulaMathJS: { type: Type.STRING }
                },
                required: ["variableName", "isolatedFormulaLatex", "isolatedFormulaMathJS"]
              }
            }
          },
          required: ["success", "latexExpression", "independentVariable", "dependentVariable", "variables", "steps", "finalAnswer"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini solver.");
    }
    const result = JSON.parse(text);
    res.json(result);
  } catch (error: any) {
    console.error("Solver Endpoint Error:", error);
    res.status(500).json({ error: error.message || "Failed to solve expression" });
  }
});

// 2. Chemistry Stoichiometry & Chemical Balancing Endpoint
app.post("/api/chemistry", async (req, res) => {
  try {
    checkApiKey();
    const { reaction, phQuery, halfLifeQuery, file } = req.body;

    if (!reaction && !phQuery && !halfLifeQuery && !file) {
      return res.status(400).json({ error: "Reaction input, pH query, half-life parameters, or an uploaded file must be provided." });
    }

    const systemInstruction = `You are a Chemistry Computational Solver.
Depending on the input, solve:
1. Chemical equation balancing (e.g. H2 + O2 -> H2O).
2. Stoichiometry calculations (calculating grams of products given grams of reactants).
3. pH and pOH calculations (using acid-base properties).
4. Half-life and radioactive decay calculations.

Return a highly detailed JSON structure. Ensure:
- 'balancedReaction' is the final balanced chemical equation in standard notation.
- 'latexReaction' is the balanced equation in LaTeX chemistry formatting (e.g., using \\ce{...} or standard symbols).
- 'reactants' and 'products' list coefficients and molar masses.
- 'molarMasses' lists chemicals and their calculated molar masses in g/mol.
- 'stoichiometrySteps' lists calculated mass-to-mass or mole-to-mole steps.
- 'phValue' and 'decayDetails' are filled if applicable.
- 'steps' provides detailed, granular balancing or stoichiometry steps.`;

    let contents: any = reaction
      ? `Balance and analyze this chemical reaction: "${reaction}"`
      : phQuery
      ? `Solve this pH query: "${phQuery}"`
      : halfLifeQuery
      ? `Solve this half-life query: "${halfLifeQuery}"`
      : "Provide general chemistry solving instructions.";

    if (file && file.data && file.mimeType) {
      const textPrompt = reaction
        ? `Balance and analyze this chemical reaction: "${reaction}"`
        : phQuery
        ? `Solve this pH query: "${phQuery}"`
        : halfLifeQuery
        ? `Solve this half-life query: "${halfLifeQuery}"`
        : "Extract and solve the chemistry task shown in this uploaded file.";

      contents = {
        parts: [
          {
            inlineData: {
              mimeType: file.mimeType,
              data: file.data
            }
          },
          {
            text: textPrompt
          }
        ]
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            success: { type: Type.BOOLEAN },
            error: { type: Type.STRING },
            balancedReaction: { type: Type.STRING },
            latexReaction: { type: Type.STRING },
            molarMasses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  substance: { type: Type.STRING },
                  molarMass: { type: Type.NUMBER }
                },
                required: ["substance", "molarMass"]
              }
            },
            reactants: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  formula: { type: Type.STRING },
                  coefficient: { type: Type.INTEGER }
                },
                required: ["formula", "coefficient"]
              }
            },
            products: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  formula: { type: Type.STRING },
                  coefficient: { type: Type.INTEGER }
                },
                required: ["formula", "coefficient"]
              }
            },
            stoichiometrySteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            phValue: { type: Type.NUMBER },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["title", "explanation"]
              }
            },
            finalExplanation: { type: Type.STRING }
          },
          required: ["success", "steps", "finalExplanation"]
        }
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini chemistry solver.");
    }
    const result = JSON.parse(text);
    res.json(result);
  } catch (error: any) {
    console.error("Chemistry Endpoint Error:", error);
    res.status(500).json({ error: error.message || "Failed to process chemistry query" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve static index.html on all other paths (SPA support)
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EQSolver backend running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode.`);
  });
}

startServer();
