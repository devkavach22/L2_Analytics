// import { responsiveArray } from "antd/es/_util/responsiveObserver";
import axios from "axios";

/**
 * Call FastAPI /agentic-report endpoint
 * @param {string} userId - The ID of the user requesting the report
 * @param {string} reportType - Type of report (e.g. "Financial Audit")
 * @param {string|null} keyword - Optional keyword to search existing DB records
 * @param {string|null} newFileText - Optional text from a newly uploaded file
 * @returns {Promise<Object>} - JSON response from FastAPI containing analysis
 */
export async function generateAgenticReport(userId, reportType, keyword = null, newFileText = null) {
  try {
    // Payload matching Python Orchestrator expectations
    const payload = {
      user_id: userId,
      report_type: reportType,
      keyword,        
      new_file_text: newFileText 
    };

    // Using Port 5000 as explicitly requested
    const response = await axios.post(
      "http://127.0.0.1:5000/agentic-report", 
      payload,
      {
        headers: { "Content-Type": "application/json" },
        // Infinite timeout for complex Agentic Analysis
        timeout: 0
      }
    );

    // Check if response is successful
    if (!response.data) {
      throw new Error("No response data from Agentic Report service");
    }

    if (response.data.success === false)
    {
      throw new Error(response.data.error || "Agentic report failed");
    }

    return  {
      success: true,
      report: response.data.report || response.data.final_report_text,
      final_report_text: response.data.final_report_text,
      download_link: response.data.download_link,
      meta: {
        keywords: response.data.keywords,
        trends: response.data.trends,
        risks: response.data.risks,
        sentiment: response.data.sentiment,
        cognitive: response.data.cognitive,
        decisions: response.data.decisions
      }
    };

    // return response.data;
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      console.error("❌ Python Service Unreachable");
      throw new Error("Python Agentic Service is not running");
    }

    // Python returned an error
    if (error.response?.data) {
      console.error(
        `❌ Python Service Error (${error.response.status}):`,
        error.response.data
      );
      throw new Error(
        error.response.data.error || "Agentic report generation failed"
      );
    }

    console.error("❌ Agentic Service Error:", error.message);
    throw new Error(error.message);
  }
  //   // 1. Check if the Python Server is unreachable
  //   if (error.code === 'ECONNREFUSED') {
  //      console.error("❌ Python Service Unreachable");
  //      throw new Error("Python AI Service is unreachable at http://127.0.0.1:5000. Is the server running?");
  //   }
    
  //   // 2. Check if Python Server sent a specific error message (e.g., 'report is undefined')
  //   if (error.response && error.response.data) {
  //       const pythonError = error.response.data.error || JSON.stringify(error.response.data);
  //       console.error(`❌ Python Service Error (${error.response.status}):`, pythonError);
  //       throw new Error(pythonError); 
  //   }

  //   // 3. Fallback generic error
  //   console.error("Error calling Agentic Report service:", error.message);
  //   throw new Error(error.message || "Agentic report failed");
  // }
}