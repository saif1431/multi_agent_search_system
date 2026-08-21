from agent import build_search_agent, build_reader_agent, writer_chain, critic_chain


def run_research_pipeline(topic: str) -> dict:

    state = {}

    # Step 1: Search for relevant information
    print("\n" + "=" * 50)
    print(f"Step 1: Searching for information on '{topic}'...")
    print("=" * 50 + "\n")

    search_agent = build_search_agent()

    search_result = search_agent.invoke({
        "messages": [
            {
                "role": "user",
                "content": f"Find recent, reliable and detailed information about: {topic}"
            }
        ]
    })

    state["search_result"] = search_result["messages"][-1].content

    print("\nSearch Results:\n", state["search_result"])


    # Step 2: Read the most relevant source
    print("\n" + "=" * 50)
    print(f"Step 2: Reading information about '{topic}'...")
    print("=" * 50 + "\n")

    reader_agent = build_reader_agent()

    reader_result = reader_agent.invoke({
        "messages": [
            {
                "role": "user",
                "content": (
                    f"Based on the following search results about '{topic}', "
                    f"pick the most relevant URL and scrape it for deeper content.\n\n"
                    f"Search Results:\n{state['search_result'][:800]}"
                )
            }
        ]
    })

    state["reader_result"] = reader_result["messages"][-1].content

    print("\nReader Result:\n", state["reader_result"])
    
#      Generate a detailed research report based on the gathered information
    
    print("\n" + "=" * 50)
    print(f"Step 3: Generating a detailed research report on '{topic}'...")
    print("=" * 50 + "\n")
    
    research_combined = (
        f"SEARCH RESULTS : \n {state['search_result']} \n\n"
        f"DETAILED SCRAPED CONTENT : \n {state['reader_result']}"
    )
    
    state["report"] = writer_chain.invoke({
          "topic": topic,
          "research": research_combined
    })   
    
    print("\n Final Report \n", state["report"])
    
    
#     Critically evaluate the report 
    
    print("\n" + "=" * 50)
    print(f"Step 3: Generating a detailed research report on '{topic}'...")
    print("=" * 50 + "\n")
    
    
    state["feedback"] = critic_chain.invoke({
          "report": state["report"]
    })
    
    print("\n Critic Report \n", state["feedback"])
    
    return state



if __name__ == "__main__":
      topic= input("\nEnter a research topic: ")
      run_research_pipeline(topic)