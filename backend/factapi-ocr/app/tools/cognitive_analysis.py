from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from .llm_loader import load_llm

class CognitiveAgent:
    def __init__(self):
        self.llm = load_llm()

    def run(self, text_sample: str):
        """
        Performs cognitive analysis: Intent, Tone, Complexity, and Hidden Biases.
        """
        try:
            # specialized prompt for psychological/linguistic analysis
            prompt = PromptTemplate(
                template="""
                You are an Expert Cognitive Linguist and Psychologist.
                Analyze the provided text sample to understand the writer's intent and state of mind.

                Text Sample:
                {text}

                Instructions:
                1. **Intent Analysis:** What is the primary goal? (e.g., to persuade, to inform, to confuse, to demand).
                2. **Tone & Sentiment:** Describe the emotional tone (e.g., Aggressive, Professional, Uncertain, Urgent).
                3. **Complexity Score:** Is it simple (1/10) or highly technical/legalese (10/10)?
                4. **Hidden Bias/Manipulation:** Are there deceptive patterns or manipulative language?

                Format the output strictly as HTML:
                <div class='cognitive-report'>
                    <h3>🧠 Cognitive Analysis</h3>
                    <ul>
                        <li><strong>Primary Intent:</strong> [Intent]</li>
                        <li><strong>Detected Tone:</strong> [Tone]</li>
                        <li><strong>Complexity:</strong> [Score]/10 ([Description])</li>
                        <li><strong>Bias/Manipulation Check:</strong> [Analysis]</li>
                    </ul>
                </div>

                Be insightful but concise.
                """,
                input_variables=["text"]
            )

            chain = prompt | self.llm | StrOutputParser()
            result = chain.invoke({"text": text_sample})
            return result

        except Exception as e:
            print(f"❌ Cognitive Agent Error: {e}")
            return "<p>Error generating cognitive analysis.</p>"