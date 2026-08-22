from rich import print

from app.pipeline import run

if __name__ == "__main__":
    question = "What is the latest research on multi-agent LLM systems?"
    print(run(question))
