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

output "terraform_state_bucket" {
  description = "S3 bucket for remote Terraform state. Copy the name into backend.hcl."
  value       = aws_s3_bucket.terraform_state.bucket
}

output "vpc_id" {
  description = "Demo VPC shared by preview and production RDS."
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs (RDS subnet group). INFRA-008 may reuse these for Fargate."
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "Public subnet IDs (bastion today; ALB later in INFRA-008)."
  value       = aws_subnet.public[*].id
}

output "preview_api_security_group_id" {
  description = "Attach to preview ECS task ENIs in INFRA-008."
  value       = aws_security_group.preview_api.id
}

output "production_api_security_group_id" {
  description = "Attach to production ECS task ENIs in INFRA-008."
  value       = aws_security_group.production_api.id
}

output "preview_rds_address" {
  description = "Preview/demo RDS hostname. Use in Secrets Manager URLs, not the SSM tunnel."
  value       = aws_db_instance.preview.address
}

output "production_rds_address" {
  description = "Production/demo RDS hostname. Use in Secrets Manager URLs, not the SSM tunnel."
  value       = aws_db_instance.production.address
}

output "bastion_instance_id" {
  description = "SSM Session Manager target for port-forward migrate/seed."
  value       = aws_instance.bastion.id
}
