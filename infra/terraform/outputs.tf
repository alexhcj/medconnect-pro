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
  description = "Attach to the preview ECS execution role (Secrets Manager injection). Do not attach to production."
  value       = aws_iam_policy.preview_secrets_read.arn
}

output "production_secrets_read_policy_arn" {
  description = "Attach to the production ECS execution role (Secrets Manager injection). Do not attach to preview."
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
  description = "Private subnet IDs (RDS subnet group and Fargate tasks)."
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "Public subnet IDs (bastion, NAT, and API ALBs)."
  value       = aws_subnet.public[*].id
}

output "preview_api_security_group_id" {
  description = "Preview ECS task ENI security group."
  value       = aws_security_group.preview_api.id
}

output "production_api_security_group_id" {
  description = "Production ECS task ENI security group."
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

output "ecr_repository_url" {
  description = "ECR repository for the NestJS API image (preview and production share the digest)."
  value       = aws_ecr_repository.api.repository_url
}

output "ecs_cluster_name" {
  description = "Shared ECS cluster. Isolation is per-service task env, secrets, SGs, RDS, and S3."
  value       = aws_ecs_cluster.main.name
}

output "preview_api_url" {
  description = "HTTPS origin for the preview API (CloudFront default domain)."
  value       = "https://${aws_cloudfront_distribution.preview_api.domain_name}"
}

output "production_api_url" {
  description = "HTTPS origin for the production API (CloudFront default domain)."
  value       = "https://${aws_cloudfront_distribution.production_api.domain_name}"
}

output "preview_document_bucket" {
  description = "Preview document object bucket. Injected as DOCUMENT_S3_BUCKET."
  value       = aws_s3_bucket.preview_documents.bucket
}

output "production_document_bucket" {
  description = "Production document object bucket. Injected as DOCUMENT_S3_BUCKET."
  value       = aws_s3_bucket.production_documents.bucket
}
