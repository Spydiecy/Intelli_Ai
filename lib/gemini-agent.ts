"use client";

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_KEY || "",
});

const GEMINI_PROMPT_TEMPLATE = `
You are a blockchain data assistant specialized in Story Protocol data. You help users filter and find IP assets, transactions, royalties, and minting fees based on their needs.

When a user asks for:
- IP Assets: Return a filter for IP assets with criteria like name, type, relationships, or other properties.
- Transactions: Return a filter for transactions with criteria like action type, block range, or IP ID.
- Royalties: Return a filter for royalty payments with criteria like amount, token type, or participants.
- Minting Fees: Return a filter for minting fees with criteria like amount, receiver, or payer.

Return your response as a JSON object with the following structure:
{
  "type": "filter",
  "dataType": "ip_assets" | "transactions" | "royalties" | "minting_fees",
  "filters": {
    // Specific filter criteria based on the data type
  },
  "explanation": "A brief explanation of the filter being applied"
}

For IP assets, filters might include:
- name: string pattern to match in asset names
- isGroup: boolean to filter group assets
- minChildren: minimum number of children
- minParents: minimum number of parents
- blockNumberRange: [min, max] for block number range

For transactions, filters might include:
- actionType: string pattern to match action types
- ipId: specific IP ID to filter by
- initiator: address pattern to match initiators
- blockNumberRange: [min, max] for block number range

For royalties, filters might include:
- minAmount: minimum payment amount
- token: specific token type
- payerIpId: pattern to match payer IP IDs
- receiverIpId: pattern to match receiver IP IDs

For minting fees, filters might include:
- minAmount: minimum fee amount
- token: specific token type
- payer: pattern to match payer addresses
- receiverIpId: pattern to match receiver IP IDs

If the query doesn't match any specific filter criteria, return a general filter with basic search terms.

User Query:
`;

export interface GeminiFilterResponse {
  type: string;
  dataType: "ip_assets" | "transactions" | "royalties" | "minting_fees";
  filters: Record<string, any>;
  explanation: string;
}

export async function geminiAgent(userQuery: string): Promise<GeminiFilterResponse> {
  try {
    const prompt = GEMINI_PROMPT_TEMPLATE + userQuery;

    const response: any = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });

    const rawText = response.text;

    try {
      // Match JSON inside ```json ... ``` or just extract the first JSON-looking block
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/{[\s\S]*}/);

      if (jsonMatch) {
        const jsonString = jsonMatch[1] || jsonMatch[0]; // depending on match type
        return JSON.parse(jsonString);
      } else {
        // If nothing matched, fallback to a general filter
        return {
          type: "filter",
          dataType: "ip_assets",
          filters: {
            searchTerm: userQuery,
          },
          explanation: "General search based on your query",
        };
      }
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
      return {
        type: "filter",
        dataType: "ip_assets",
        filters: {
          searchTerm: userQuery,
        },
        explanation: "General search based on your query",
      };
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return {
      type: "filter",
      dataType: "ip_assets",
      filters: {
        searchTerm: userQuery,
      },
      explanation: "General search based on your query",
    };
  }
}
