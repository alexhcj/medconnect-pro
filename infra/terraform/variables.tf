variable "aws_region" {
  type        = string
  description = "AWS region for VPC, RDS, Secrets Manager, and the SSM bastion. IAM OIDC resources are global."
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
