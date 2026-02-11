import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Using the versatile model as requested
export const getGroqModel = () => {
    return "llama-3.3-70b-versatile";
};

export default groq;
