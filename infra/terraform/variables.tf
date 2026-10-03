variable "aws_region" {
  type        = string
  description = "AWS region for Secrets Manager. IAM OIDC resources are global."
  default     = "us-east-1"
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
