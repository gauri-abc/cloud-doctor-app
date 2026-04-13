export const handler = async (event) => {
    // Enable CORS to allow the Azure frontend to communicate with this logic.
    const headers = {
        "Access-Control-Allow-Origin": "*", // For production, restrict this to your Azure Static Web Apps URL
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
    };

    // Handle OPTIONS requests for CORS preflight
    if ((event.requestContext && event.requestContext.http && event.requestContext.http.method === "OPTIONS") || event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers, body: "OK" };
    }

    try {
        // Parse request body
        let query = "";
        if (event.body) {
            // Determine if the body is already parsed by API Gateway integration, otherwise parse it
            const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
            query = body.query ? String(body.query).toLowerCase() : "";
        } else if (event.queryStringParameters && event.queryStringParameters.query) {
             query = event.queryStringParameters.query.toLowerCase();
        }

        if (!query) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: "Please provide a 'query' in the request body." })
            };
        }

        // Fetch Knowledge Base from GCP public bucket
        // IMPORTANT: REPLACE THIS URL WITH YOUR ACTUAL PUBLIC GCP BUCKET URL 
        // e.g., "https://storage.googleapis.com/your-cloud-doctor-bucket/knowledge_base.json"
        // Below is a placeholder. If this fails, the catch block will supply an error.
        const GCP_BUCKET_URL = "https://storage.googleapis.com/YOUR_BUCKET_NAME/knowledge_base.json";
        
        let knowledgeBase = [];
        try {
            const response = await fetch(GCP_BUCKET_URL);
            if (!response.ok) {
                throw new Error(`Failed to fetch from GCP. Status: ${response.status}`);
            }
            knowledgeBase = await response.json();
        } catch (fetchError) {
             // Fallback for demonstration if the bucket URL hasn't been replaced yet 
             // so the API still "works". Remove this fallback in actual production!
             console.warn("Could not fetch GCP data (probably placeholder URL), using fallback data.", fetchError);
             knowledgeBase = [
                 {
                    "keywords": ["fallback", "test", "database", "timeout"],
                    "issue": "[Fallback Mode] Database Timeout",
                    "cause": "Could not reach the database. Note: This is a fallback response because the GCP_BUCKET_URL in AWS Lambda has not been configured yet.",
                    "fix": "1. Update the GCP_BUCKET_URL in lambda backend. 2. Ensure your GCP storage blob is publicly accessible."
                 }
             ];
        }
        
        // Keyword matching algorithm
        let bestMatch = null;
        let maxMatchCount = 0;

        for (const item of knowledgeBase) {
            let matchCount = 0;
            for (const keyword of item.keywords) {
                if (query.includes(keyword.toLowerCase())) {
                    matchCount++;
                }
            }
            // Pick the match with the most overlapping keywords
            if (matchCount > maxMatchCount) {
                maxMatchCount = matchCount;
                bestMatch = item;
            }
        }

        if (bestMatch) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    diagnosis: bestMatch
                })
            };
        } else {
             // No keywords matched
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "Cloud Doctor couldn't pinpoint the issue based on your query. Try using terms like 'CORS', 'timeout', '502 bad gateway', or 'OOM memory leak'."
                })
            };
        }

    } catch (error) {
        console.error("Error processing request:", error);
        
        // Return a structured error response
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: "Internal Server Error", 
                details: error.message,
                message: "Cloud Doctor API encountered an HTTP 500 error."
            })
        };
    }
};
