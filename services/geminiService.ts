import { GoogleGenAI, Chat, FunctionDeclaration, Type } from "@google/genai";
import { GraphData } from "../types";
import { SYSTEM_INSTRUCTION, CHAT_SYSTEM_INSTRUCTION } from "../constants";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Tool Definition
export const createNodeTool: FunctionDeclaration = {
  name: "create_node",
  description: "Create a new node/entity in the knowledge graph. Use this when the user explicitly asks to add information or when you identify a missing critical entity.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      label: { type: Type.STRING, description: "Short name of the entity (e.g., 'John Doe', 'Contract B')" },
      type: { type: Type.STRING, description: "One of: ENTITY, EVENT, CONFLICT, DISCREPANCY" },
      description: { type: Type.STRING, description: "Context or details about this node" },
      timestamp: { type: Type.STRING, description: "ISO Date string if applicable" }
    },
    required: ["label", "type"]
  }
};

export const fileToPart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      
      if (!result) {
        reject(new Error(`Failed to read file: ${file.name}`));
        return;
      }

      // Check for empty file content (e.g. "data:image/png;base64,")
      const parts = result.split(',');
      if (parts.length < 2 || parts[1].length === 0) {
        reject(new Error(`File content is empty: ${file.name}`));
        return;
      }
      
      const base64Data = parts[1];
      const mimeType = file.type || 'application/octet-stream';

      resolve({
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      });
    };
    reader.onerror = () => reject(new Error(`Error reading file: ${file.name}`));
    reader.readAsDataURL(file);
  });
};

export const processEvidenceFiles = async (files: File[]): Promise<GraphData> => {
  try {
    const parts = await Promise.all(files.map(fileToPart));

    const promptText = `
      Analyze the attached evidence files. 
      Extract entities, relationships, events, and specifically look for contradictions.
      Construct a Knowledge Graph JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          ...parts,
          { text: promptText }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 1024 }, 
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    // Clean potential markdown blocks if present
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonStr);

    return data as GraphData;

  } catch (error) {
    console.error("Gemini Processing Error:", error);
    throw error;
  }
};

export const createEvidenceChat = async (files: File[]): Promise<Chat> => {
  try {
    const parts = await Promise.all(files.map(fileToPart));

    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: CHAT_SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: [createNodeTool] }],
      },
      history: [
        {
          role: 'user',
          parts: [
            ...parts,
            { text: "Here is the collected evidence for this case. Please study it carefully." }
          ]
        },
        {
          role: 'model',
          parts: [{ text: "I have analyzed the evidence files. I am ready to answer your questions with specific citations." }]
        }
      ]
    });
    
    return chat;
  } catch (error) {
    console.error("Failed to create chat session", error);
    throw error;
  }
};
