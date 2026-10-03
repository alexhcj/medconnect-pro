locals {
  empty_api_secret = jsonencode({
    DATABASE_URL       = ""
    DATABASE_ADMIN_URL = ""
  })
}

resource "aws_secretsmanager_secret" "preview_api" {
  name                    = "medconnect/preview/api"
  description             = "Preview API runtime secrets (DATABASE_URL, DATABASE_ADMIN_URL). Values filled by INFRA-007."
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "preview_api" {
  secret_id     = aws_secretsmanager_secret.preview_api.id
  secret_string = local.empty_api_secret

  lifecycle {
    ignore_changes = [secret_string]
  }
}

resource "aws_secretsmanager_secret" "production_api" {
  name                    = "medconnect/production/api"
  description             = "Production API runtime secrets (DATABASE_URL, DATABASE_ADMIN_URL). Values filled by INFRA-007."
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "production_api" {
  secret_id     = aws_secretsmanager_secret.production_api.id
  secret_string = local.empty_api_secret

  lifecycle {
    ignore_changes = [secret_string]
  }
}
