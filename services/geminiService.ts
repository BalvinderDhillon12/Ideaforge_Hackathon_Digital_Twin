import { GoogleGenAI } from "@google/genai";
import { PatientData, RadiomicsData, TreatmentPlan } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateClinicalReasoning = async (
  patient: PatientData,
  radiomics: RadiomicsData[],
  selectedTreatment: TreatmentPlan | null
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "API Key missing. Cannot generate reasoning.";

  const radiomicsSummary = radiomics.map(r => `${r.feature}: ${r.actualValue}`).join(', ');
  
  const prompt = `
    You are an advanced expert system for Neuro-Oncology.
    
    Patient Context:
    - Age: ${patient.age}
    - Gender: ${patient.gender}
    - Diagnosis: ${patient.diagnosis}
    
    Extracted PyRadiomics Features (Bio-markers):
    ${radiomicsSummary}

    Task:
    ${selectedTreatment 
      ? `Provide a detailed clinical justification for choosing the treatment protocol: "${selectedTreatment.name}" (Confidence: ${(selectedTreatment.probability * 100).toFixed(1)}%). Explain how the radiomics features support this choice using principles of Soft Actor-Critic RL optimization and Model Agnostic Meta Learning (MAML) adaptation.` 
      : `Analyze the radiomics features and patient demographic to suggest why a personalized treatment plan is critical. Mention potential molecular subtypes (like IDH mutation or MGMT promoter methylation) that might be inferred from these texture features.`}
    
    Keep the tone professional, clinical, and concise (max 200 words).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Using Pro for better reasoning
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 1024 } // Enable thinking for reasoning
      }
    });
    return response.text || "Analysis complete. No text generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI Reasoning unavailable at this time.";
  }
};

export const chatWithTwin = async (
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  message: string
) => {
  const ai = getAiClient();
  if (!ai) return "API Key missing.";

  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: history,
      config: {
        systemInstruction: "You are the 'Digital Twin' interface of a brain tumor model. You simulate the biological responses of the specific tumor based on current parameters. Answer clinical questions about your growth, resistance to drugs, and genetic makeup based on the simulation context."
      }
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("Chat Error:", error);
    return "System offline.";
  }
};