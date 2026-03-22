from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://devforge:devforge@localhost:5432/devforge_knowledge"
    redis_url: str = "redis://localhost:6379"
    cors_origins: list[str] = ["http://localhost:3000"]
    jwt_public_key: str = ""

    class Config:
        env_prefix = "KNOWFORGE_"
        env_file = ".env"


settings = Settings()
