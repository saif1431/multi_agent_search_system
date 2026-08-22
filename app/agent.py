from langchain.agents import create_agent

from app.llm import llm
from app.tools import web_search, scrape_url

SYSTEM_PROMPT = (
    "You are a research agent. Use the web_search tool to find relevant sources, "
    "then use the scrape_url tool to read the most promising pages in full before answering. "
    "Always ground your findings in what the tools return - do not invent facts or URLs. "
    "Keep your final response focused on the research findings themselves, "
    "including the source URLs you relied on."
)

research_agent = create_agent(
    model=llm,
    tools=[web_search, scrape_url],
    system_prompt=SYSTEM_PROMPT,
)


def run_research_agent(question: str) -> str:
    """Invoke the ReAct research agent and return its final text answer."""
    result = research_agent.invoke({"messages": [{"role": "user", "content": question}]})
    return result["messages"][-1].content
