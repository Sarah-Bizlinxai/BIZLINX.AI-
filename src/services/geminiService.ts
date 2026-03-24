import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  summary: string;
  industry: string;
  revenue: number;
  ebitda: number;
  sde?: number;
  askingPrice: number;
  location: string;
  imageUrl: string;
  sourceUrl?: string;
  isFranchise: boolean;
  status: string;
  verified: boolean;
  createdAt?: any;
}

export interface UserPreferences {
  industries: string[];
  minRevenue: number;
  maxAskingPrice: number;
  locations: string[];
}

export async function getMatches(preferences: UserPreferences, listings: Listing[]) {
  const prompt = `
    As an expert M&A business broker, match a buyer with the following preferences to the available listings.
    
    Buyer Preferences:
    - Industries: ${preferences.industries.join(', ')}
    - Min Revenue: $${preferences.minRevenue}
    - Max Asking Price: $${preferences.maxAskingPrice}
    - Locations: ${preferences.locations.join(', ')}
    
    Available Listings:
    ${listings.map(l => `ID: ${l.id}, Title: ${l.title}, Industry: ${l.industry}, Revenue: $${l.revenue}, Price: $${l.askingPrice}, Location: ${l.location}`).join('\n')}
    
    Return a list of matches with a score (0-100) and a brief reasoning for each.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            listingId: { type: Type.STRING },
            score: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
          },
          required: ["listingId", "score", "reasoning"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse matches:", e);
    return [];
  }
}

export async function getDueDiligenceChecklist(listing: Listing) {
  const prompt = `
    Generate a comprehensive due diligence checklist for a buyer interested in purchasing the following business:
    
    Business: ${listing.title}
    Industry: ${listing.industry}
    Revenue: $${listing.revenue}
    Location: ${listing.location}
    
    Provide a list of tasks categorized by Financial, Legal, Operational, and Human Resources.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            task: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["category", "task", "description"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse checklist:", e);
    return [];
  }
}

export async function getAiBrokerConsultation(role: string, context: string, userQuestion: string) {
  const prompt = `
    You are the Lead AI Broker at BizLinx, the world's first AI-driven M&A firm. 
    Your goal is to help ${role}s navigate the complex process of buying or selling a business without human brokers.
    
    Context of the deal/situation:
    ${context}
    
    User Question:
    ${userQuestion}
    
    Provide professional, actionable, and strategic advice. If the user is a seller, focus on maximizing value and ensuring a smooth exit. If a buyer, focus on due diligence and fair valuation.
    Be concise but thorough.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text || "I'm sorry, I couldn't generate a consultation at this time. Please try rephrasing your question.";
}

export async function crawlBizBuySell(minSDE: number = 200000) {
  const prompt = `Find 5 active business listings on BizBuySell.com that have a Seller's Discretionary Earnings (SDE) of ${minSDE.toLocaleString()} or more. 
  For each listing, provide:
  - Title
  - Industry
  - Location
  - Asking Price
  - Revenue
  - SDE
  - Description
  - A direct URL to the listing on BizBuySell.
  
  Return the results as a JSON array of objects.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            industry: { type: Type.STRING },
            location: { type: Type.STRING },
            askingPrice: { type: Type.NUMBER },
            revenue: { type: Type.NUMBER },
            sde: { type: Type.NUMBER },
            description: { type: Type.STRING },
            url: { type: Type.STRING }
          },
          required: ["title", "industry", "location", "askingPrice", "revenue", "sde", "description", "url"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse crawled listings:", e);
    return [];
  }
}

export async function calculateMatchScore(buyerAnswers: Record<string, string>, sellerAnswers: Record<string, string>) {
  const prompt = `
    As an expert M&A matching engine, calculate a match score (0-100) between a buyer and a seller based on their onboarding answers.
    
    Buyer Profile (10 Questions):
    ${JSON.stringify(buyerAnswers, null, 2)}
    
    Seller Profile (10 Questions):
    ${JSON.stringify(sellerAnswers, null, 2)}
    
    Consider:
    - Financial alignment (Capital vs Revenue/EBITDA)
    - Industry preference
    - Timeline alignment
    - Risk tolerance vs Business stability
    - Transition expectations
    
    Return a JSON object with:
    - score: number (0-100)
    - reasoning: string (brief explanation)
    - buyerProfileSummary: string (a summary of the buyer for the seller)
    - sellerProfileSummary: string (a summary of the seller for the buyer)
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          reasoning: { type: Type.STRING },
          buyerProfileSummary: { type: Type.STRING },
          sellerProfileSummary: { type: Type.STRING }
        },
        required: ["score", "reasoning", "buyerProfileSummary", "sellerProfileSummary"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse match score:", e);
    return { score: 0, reasoning: "Error calculating match.", buyerProfileSummary: "", sellerProfileSummary: "" };
  }
}
