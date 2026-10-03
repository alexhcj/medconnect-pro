locals {
  preview_api_secret = jsonencode({
    DATABASE_URL       = local.preview_database_url
    DATABASE_ADMIN_URL = local.preview_database_admin_url
  })
  production_api_secret = jsonencode({
    DATABASE_URL       = local.production_database_url
    DATABASE_ADMIN_URL = local.production_database_admin_url
  })
}

resource "aws_secretsmanager_secret" "preview_api" {
  name                    = "medconnect/preview/api"
  description             = "Preview API runtime secrets (DATABASE_URL, DATABASE_ADMIN_URL). Hosted RDS URLs; never Compose passwords."
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "preview_api" {
  secret_id     = aws_secretsmanager_secret.preview_api.id
  secret_string = local.preview_api_secret

  lifecycle {
    ignore_changes = [secret_string]
  }
}

resource "aws_secretsmanager_secret" "production_api" {
  name                    = "medconnect/production/api"
  description             = "Production API runtime secrets (DATABASE_URL, DATABASE_ADMIN_URL). Hosted RDS URLs; never Compose passwords."
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "production_api" {
  secret_id     = aws_secretsmanager_secret.production_api.id
  secret_string = local.production_api_secret

  lifecycle {
    ignore_changes = [secret_string]
  }
}
