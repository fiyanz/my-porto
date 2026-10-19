from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Portfolio API"
    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Supabase Configuration
    SUPABASE_URL: str | None = None
    SUPABASE_PUBLISHABLE_KEY: str | None = None
    SUPABASE_SECRET_KEY: str | None = None
    SUPABASE_JWKS_URL: str | None = None

    # Developer Telemetry Configuration
    WAKATIME_API_KEY: str | None = None

    # Google Drive Certificates Configuration
    GOOGLE_DRIVE_FOLDER_URL: str | None = None
    GOOGLE_DRIVE_API_KEY: str | None = None

    class Config:
        env_file = [".env", "../.env"]
        extra = "ignore"

settings = Settings()
