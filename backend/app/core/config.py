from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "24Sie7e API"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "sqlite:///./24sie7e.db"

    # Placeholder auth (single admin account)
    admin_username: str = "admin"
    admin_password: str = "admin"
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 60 * 8

    # Mercado Pago (POC)
    mp_access_token: str = ""
    mp_environment: str = "sandbox"
    mp_currency: str = "ARS"
    mp_notification_url: str | None = None

    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


settings = Settings()
