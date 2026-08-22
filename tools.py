from langchain.tools import tool
import requests
from  bs4 import BeautifulSoup
from tavily import TavilyClient
import os
from rich import print
from dotenv import load_dotenv
load_dotenv()


tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

 
@tool
def web_search(query: str) -> str:
      """Search the web for recent and reliable information on a topic. Return Titles, URLs, and Snippets"""
      
      result = tavily.search(query=query, max_results=2)

      out = []

      for r in result["results"]:
            out.append(f"Title: {r['title']}\nURL: {r['url']}\nContent: {r['content'][:400]}\n")
            
      return "\n----\n".join(out)
      

@tool
def scrape_url(url: str) -> str:
      """Scrape and return clean text content from a given URL for deeper reading."""
      try:
          res = requests.get(url, timeout=8, headers={"User-Agent": "Mozilla/5.0"})
          soup = BeautifulSoup(res.text, "html.parser")
          for tag in soup(["script", "style", "nav", "footer"]):
                tag.decompose()
          return soup.get_text(separator=" ", strip=True)[:800]
      
      except Exception as e:
            return f"Error scraping URL: {e}"
      