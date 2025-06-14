"use client"

import { enhancedGeminiAgent } from "./enhanced-gemini-agent"
import { fixedGaiaAgent } from "./gaia-agent"
import { geminiAgent } from "./gemini-agent"

/**
 * Query complexity categories to determine which agent to use
 */
type QueryComplexity = "simple" | "medium" | "complex" | "analytics"

/**
 * Determines the complexity of a user query to route to the appropriate agent
 */
function determineQueryComplexity(query: string): QueryComplexity {
  const lowerQuery = query.toLowerCase().trim()
  
  // Analytics-specific patterns (use gemini for these complex analytical queries)
  const analyticsPatterns = [
    /total.*(volume|revenue|royalties|fees)/i,
    /average.*(price|fee|royalty)/i, 
    /trends?/i,
    /analytics/i,
    /performance/i,
    /statistics/i,
    /growth/i,
    /(highest|top).*(royalt|fee|volume)/i,
    /metrics/i,
    /kpi/i
  ]
  
  if (analyticsPatterns.some(pattern => pattern.test(lowerQuery))) {
    return "analytics"
  }
  
  // Simple patterns (use gaia for these)
  const simplePatterns = [
    /^(hi|hello|hey)$/i,
    /^(thanks?|thank you)$/i,
    /what.*can.*you.*do/i,
    /^(show|list|get).*assets?$/i,
    /^(show|list|get).*transactions?$/i,
    /^help$/i
  ]

  if (simplePatterns.some(pattern => pattern.test(lowerQuery))) {
    return "simple"
  }

  // Complex patterns (use gemini for these)
  const complexPatterns = [
    /bridge/i,
    /create.*asset/i,
    /filter.*by/i,
    /search.*for/i,
    /cross-chain/i,
    /compare/i,
    /analyze/i,
    /predict/i,
    /relationship/i,
    /history.*of/i,
    /why.*did/i,
    /how.*can/i,
    /should.*i/i
  ]

  if (complexPatterns.some(pattern => pattern.test(lowerQuery))) {
    return "complex"
  }

  // Default to medium complexity
  return "medium"
}

/**
 * Combined agent that intelligently routes queries to the appropriate AI model
 * based on query complexity and content
 */
export async function combinedAgent(userQuery: string): Promise<any> {
  console.log("Processing query:", userQuery)
  
  try {
    const complexity = determineQueryComplexity(userQuery)
    console.log(`Query complexity determined as: ${complexity}`)
    
    switch (complexity) {
      case "simple":
        // Use Gaia for simple queries
        try {
          console.log("Routing to Gaia agent (simple query)")
          return await fixedGaiaAgent(userQuery)
        } catch (error) {
          console.error("Gaia agent failed, falling back to Gemini:", error)
          return await enhancedGeminiAgent(userQuery)
        }
        
      case "analytics":
        // Use enhanced Gemini specifically for analytics queries
        console.log("Routing to specialized analytics handler (analytics query)")
        return await handleAnalyticsQuery(userQuery)
        
      case "complex":
        // Use enhanced Gemini for complex queries
        console.log("Routing to Enhanced Gemini agent (complex query)")
        return await enhancedGeminiAgent(userQuery)
        
      case "medium":
      default:
        // For medium queries, use the more reliable agent
        console.log("Routing to standard Gemini agent (medium query)")
        return await geminiAgent(userQuery)
    }
  } catch (error) {
    console.error("Combined agent error:", error)
    // Ultimate fallback
    return {
      type: "conversational",
      explanation: "I'm having trouble processing your request. Please try rephrasing your question.",
    }
  }
}

/**
 * Specialized handler for analytics-related queries
 */
async function handleAnalyticsQuery(query: string): Promise<any> {
  console.log("Processing analytics query:", query)
  const lowerQuery = query.toLowerCase()
  
  // Extract specific analytics needs
  let analyticsType = "general"
  let specificMetric = ""
  
  if (lowerQuery.includes("total volume")) {
    analyticsType = "total_volume"
    specificMetric = "volume"
  } else if (lowerQuery.includes("total royalt")) {
    analyticsType = "total_royalties"
    specificMetric = "royalties"
  } else if (lowerQuery.includes("total fee")) {
    analyticsType = "total_fees"
    specificMetric = "fees"
  } else if (lowerQuery.includes("highest") || lowerQuery.includes("top")) {
    analyticsType = "top_performers"
    
    if (lowerQuery.includes("royalt")) {
      specificMetric = "royalties"
    } else if (lowerQuery.includes("fee")) {
      specificMetric = "fees"
    } else if (lowerQuery.includes("asset")) {
      specificMetric = "assets"
    }
  } else if (lowerQuery.includes("trend") || lowerQuery.includes("over time")) {
    analyticsType = "trends"
    
    if (lowerQuery.includes("royalt")) {
      specificMetric = "royalties"
    } else if (lowerQuery.includes("fee")) {
      specificMetric = "fees"
    } else if (lowerQuery.includes("asset")) {
      specificMetric = "assets"
    }
  }
  
  // Process analytics with enhanced Gemini with specific parameters
  try {
    const response = await enhancedGeminiAgent(query)
    
    // Enhance response with analytics-specific type and parameters
    return {
      ...response,
      type: "analytics",
      parameters: {
        ...response.parameters,
        analyticsType,
        specificMetric,
        timeframe: extractTimeframe(query),
      },
      explanation: response.explanation || `Analyzing ${specificMetric || 'data'} for your query about ${analyticsType.replace('_', ' ')}`
    }
  } catch (error) {
    console.error("Analytics handling error:", error)
    return {
      type: "analytics",
      parameters: {
        analyticsType,
        specificMetric,
        timeframe: extractTimeframe(query),
      },
      explanation: `I'll show you analytics about ${specificMetric || 'performance metrics'} regarding ${analyticsType.replace('_', ' ')}`
    }
  }
}

/**
 * Extract timeframe from query if present
 */
function extractTimeframe(query: string): string {
  const lowerQuery = query.toLowerCase()
  
  if (lowerQuery.includes("today")) return "today"
  if (lowerQuery.includes("yesterday")) return "yesterday" 
  if (lowerQuery.includes("this week")) return "this_week"
  if (lowerQuery.includes("last week")) return "last_week"
  if (lowerQuery.includes("this month")) return "this_month"
  if (lowerQuery.includes("last month")) return "last_month"
  if (lowerQuery.includes("this year")) return "this_year"
  if (lowerQuery.includes("last year")) return "last_year"
  if (lowerQuery.includes("all time")) return "all_time"
  
  // Default to "all" if no timeframe specified
  return "all_time"
}
