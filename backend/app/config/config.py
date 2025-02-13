from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_NAME: str = "llm_chat_app"
    OPENAI_API_KEY: str

    class Config:
        env_file = ".env"

settings = Settings() 