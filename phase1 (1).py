"""PDF Question Answering Pipeline using LangChain, FAISS, and HuggingFace APIs."""

from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings, HuggingFaceEndpoint
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from langchain.chains.retrieval_qa.base import RetrievalQA
from dotenv import load_dotenv, find_dotenv
import os

# Configuration
DATA_PATH = r'./dataset'
VECTOR_DATABASE_PATH = 'vectorstore/database_fs'
HUGGINGFACE_REPO_ID = "mistralai/Mistral-7B-Instruct-v0.3"

def load_files(data_path: str):
    """Load PDF documents from a given directory."""
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset path '{data_path}' does not exist!")
    
    loader = DirectoryLoader(data_path, glob='*.pdf', loader_cls=PyPDFLoader)
    documents = loader.load()
    
    if not documents:
        raise ValueError(f"No PDF files found in '{data_path}'")
    
    return documents

def create_chunks(extracted_data):
    """Split documents into smaller chunks for better processing."""
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=60)
    text_chunks = text_splitter.split_documents(extracted_data)
    return text_chunks

def get_embedding_model():
    """Initialize the HuggingFace embedding model."""
    embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    return embedding_model

def create_or_load_vectorstore(force_recreate=False):
    """Create new vectorstore or load existing one."""
    embedding_model = get_embedding_model()
    
    # Check if vectorstore already exists
    if os.path.exists(VECTOR_DATABASE_PATH) and not force_recreate:
        print("Loading existing vector database...")
        db = FAISS.load_local(VECTOR_DATABASE_PATH, embedding_model, allow_dangerous_deserialization=True)
        print("✓ Vector database loaded successfully!")
        return db, embedding_model
    
    # Create new vectorstore
    print("Creating new vector database...")
    documents = load_files(data_path=DATA_PATH)
    print(f"Number of pages loaded: {len(documents)}")
    
    text_chunks = create_chunks(extracted_data=documents)
    print(f"Length of Text Chunks: {len(text_chunks)}")
    
    db = FAISS.from_documents(text_chunks, embedding_model)
    db.save_local(VECTOR_DATABASE_PATH)
    print("✓ Vector database created and saved successfully!")
    
    return db, embedding_model

def load_llm(huggingface_repo_id: str):
    """Load LLM from Hugging Face Inference Endpoint."""
    llm = HuggingFaceEndpoint(
        repo_id=huggingface_repo_id,
        task="text-generation",
        temperature=0.6,
        max_new_tokens=512,
    )
    return llm

CUSTOM_PROMPT_TEMPLATE = """
    You are a helpful and friendly assistant that answers questions strictly based on the provided context.

    Instructions:
    - Start the response with a short, friendly greeting like "Hello!", "Hi there!", or "Hey!".
    - Vary the greeting naturally to make responses feel less robotic.
    - After the greeting, immediately answer the user's question based only on the given context.
    - If the answer cannot be found in the context, reply: "I don't know based on the provided information."
    - Avoid adding any external knowledge, personal opinions, or fabricated information.
    - Keep the answer clear, factual, and concise.

    Here is the context:
    {context}

    Here is the user's question:
    {question}

    Respond naturally:
    """

def set_custom_prompt(custom_prompt_template: str):
    """Create a custom PromptTemplate for QA."""
    prompt = PromptTemplate(template=custom_prompt_template, input_variables=["context", "question"])
    return prompt

def main():
    """Main execution function."""
    # Load environment variables
    load_dotenv(find_dotenv())
    HF_TOKEN = os.environ.get("HF_TOKEN")
    
    if not HF_TOKEN:
        raise ValueError("HF_TOKEN not found! Please create a .env file with your HuggingFace token.")
    
    # Create or load vectorstore
    db, embedding_model = create_or_load_vectorstore(force_recreate=False)
    
    # Setup QA chain
    print("Setting up QA chain...")
    qa_chain = RetrievalQA.from_chain_type(
        llm=load_llm(HUGGINGFACE_REPO_ID),
        chain_type="stuff",
        retriever=db.as_retriever(search_kwargs={'k': 3}),
        return_source_documents=True,
        chain_type_kwargs={'prompt': set_custom_prompt(CUSTOM_PROMPT_TEMPLATE)}
    )
    
    print("✓ Ready to answer questions!\n")
    
    # Query loop
    while True:
        user_query = input("\nAsk your question (or type 'exit' to quit): ")
        
        if user_query.lower() in ['exit', 'quit', 'q']:
            print("Goodbye!")
            break
        
        if not user_query.strip():
            continue
        
        print("\nProcessing your question...")
        response = qa_chain.invoke({'query': user_query})
        
        print("\n" + "="*50)
        print("ANSWER:")
        print("="*50)
        print(response["result"])
        print("\n" + "="*50)
        print("SOURCE DOCUMENTS:")
        print("="*50)
        for i, doc in enumerate(response["source_documents"], 1):
            print(f"{i}. {doc.metadata.get('source', 'Unknown source')}")

if __name__ == "__main__":
    main()