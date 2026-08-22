from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda, RunnablePassthrough

from agent import run_research_agent
from llm import llm

SYNTHESIS_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a research editor. You are given raw research notes gathered by a "
            "research agent (from web search and page scraping) and the original question. "
            "Write a clear, well-organized final answer to the question, using only the "
            "information in the notes. End with a 'Sources' section listing the URLs used. "
            "If the notes are insufficient to answer, say so explicitly.",
        ),
        (
            "human",
            "Question: {question}\n\nResearch notes:\n{research}",
        ),
    ]
)

# LCEL pipeline (Runnables piped with `|`, no legacy Chain classes):
#   1. RunnablePassthrough.assign attaches the ReAct agent's research findings
#      to the input dict under the "research" key, keeping "question" intact.
#   2. The prompt formats {question} + {research} into messages.
#   3. The llm generates the final synthesized answer.
#   4. StrOutputParser extracts plain text from the LLM's message output.
research_pipeline = (
    RunnablePassthrough.assign(
        research=RunnableLambda(lambda x: run_research_agent(x["question"]))
    )
    | SYNTHESIS_PROMPT
    | llm
    | StrOutputParser()
)


def run(question: str) -> str:
    return research_pipeline.invoke({"question": question})
