output "preview_secret_name" {
  description = "Secrets Manager name for preview API DATABASE_* keys."
  value       = aws_secretsmanager_secret.preview_api.name
}

output "preview_secret_arn" {
  description = "Secrets Manager ARN for preview API DATABASE_* keys."
  value       = aws_secretsmanager_secret.preview_api.arn
}

output "production_secret_name" {
  description = "Secrets Manager name for production API DATABASE_* keys."
  value       = aws_secretsmanager_secret.production_api.name
}

output "production_secret_arn" {
  description = "Secrets Manager ARN for production API DATABASE_* keys."
  value       = aws_secretsmanager_secret.production_api.arn
}

output "github_preview_role_arn" {
  description = "OIDC role for GitHub Actions against this repository (preview secret read)."
  value       = aws_iam_role.github_preview.arn
}

output "github_production_role_arn" {
  description = "OIDC role for GitHub Actions on refs/heads/main (production secret read)."
  value       = aws_iam_role.github_production.arn
}

output "preview_secrets_read_policy_arn" {
  description = "Attach to the preview ECS task role in INFRA-008. Do not attach to production."
  value       = aws_iam_policy.preview_secrets_read.arn
}

output "production_secrets_read_policy_arn" {
  description = "Attach to the production ECS task role in INFRA-008. Do not attach to preview."
  value       = aws_iam_policy.production_secrets_read.arn
}
