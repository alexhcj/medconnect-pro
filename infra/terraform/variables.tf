variable "aws_region" {
  type        = string
  description = "AWS region for VPC, RDS, ECS, Secrets Manager, and the SSM bastion. IAM OIDC resources are global."
  default     = "us-east-1"
}

variable "vpc_cidr" {
  type        = string
  description = "IPv4 CIDR for the single demo VPC (preview and production RDS share this VPC; isolation is security groups and secrets)."
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "vpc_cidr must be a valid IPv4 CIDR block."
  }
}

variable "github_repository" {
  type        = string
  description = "GitHub owner/repo for OIDC role trust conditions (no .git suffix)."

  validation {
    condition     = can(regex("^[^/\\s]+/[^/\\s]+$", var.github_repository))
    error_message = "github_repository must be OWNER/REPO with no extra slashes or whitespace."
  }
}

variable "github_oidc_audience" {
  type        = string
  description = "OIDC audience claimed by GitHub Actions (aws-actions/configure-aws-credentials)."
  default     = "sts.amazonaws.com"
}

variable "preview_web_origins" {
  type        = string
  description = "Comma-separated CORS origins for the preview API. May include https://*.amplifyapp.com until Amplify hostnames are known."
  default     = "https://*.amplifyapp.com"
}

variable "production_web_origins" {
  type        = string
  description = "Comma-separated exact CORS origins for the production API. No localhost and no preview hostname patterns."
  default     = ""
}

variable "api_image_tag" {
  type        = string
  description = "ECR image tag for both preview and production API tasks. Push this tag before the first ECS service create, or set api_desired_count=0."
  default     = "latest"
}

variable "api_desired_count" {
  type        = number
  description = "Desired Fargate tasks per API service. Set 0 on first apply if the image tag is not in ECR yet."
  default     = 1

  validation {
    condition     = var.api_desired_count >= 0 && var.api_desired_count <= 2
    error_message = "api_desired_count must be between 0 and 2 for this demo."
  }
}
