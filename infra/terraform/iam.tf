data "aws_iam_policy_document" "preview_secrets_read" {
  statement {
    sid    = "ReadPreviewApiSecret"
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret",
    ]
    resources = [
      aws_secretsmanager_secret.preview_api.arn,
      "${aws_secretsmanager_secret.preview_api.arn}*",
    ]
  }
}

data "aws_iam_policy_document" "production_secrets_read" {
  statement {
    sid    = "ReadProductionApiSecret"
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret",
    ]
    resources = [
      aws_secretsmanager_secret.production_api.arn,
      "${aws_secretsmanager_secret.production_api.arn}*",
    ]
  }
}

resource "aws_iam_policy" "preview_secrets_read" {
  name        = "medconnect-preview-secrets-read"
  description = "Read medconnect/preview/api only. Attach to preview GitHub OIDC and the preview ECS execution role."
  policy      = data.aws_iam_policy_document.preview_secrets_read.json
}

resource "aws_iam_policy" "production_secrets_read" {
  name        = "medconnect-production-secrets-read"
  description = "Read medconnect/production/api only. Attach to production GitHub OIDC and the production ECS execution role."
  policy      = data.aws_iam_policy_document.production_secrets_read.json
}

resource "aws_iam_role_policy_attachment" "github_preview_secrets" {
  role       = aws_iam_role.github_preview.name
  policy_arn = aws_iam_policy.preview_secrets_read.arn
}

resource "aws_iam_role_policy_attachment" "github_production_secrets" {
  role       = aws_iam_role.github_production.name
  policy_arn = aws_iam_policy.production_secrets_read.arn
}

data "aws_iam_policy_document" "github_ecr_push" {
  statement {
    sid       = "EcrAuth"
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    sid    = "EcrPushApi"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:CompleteLayerUpload",
      "ecr:DescribeRepositories",
      "ecr:GetDownloadUrlForLayer",
      "ecr:InitiateLayerUpload",
      "ecr:PutImage",
      "ecr:UploadLayerPart",
    ]
    resources = [aws_ecr_repository.api.arn]
  }
}

resource "aws_iam_policy" "github_ecr_push" {
  name        = "medconnect-github-ecr-push"
  description = "Push medconnect-api images from GitHub Actions on main (INFRA-008). ECS rolling deploy remains INFRA-011."
  policy      = data.aws_iam_policy_document.github_ecr_push.json
}

resource "aws_iam_role_policy_attachment" "github_production_ecr" {
  role       = aws_iam_role.github_production.name
  policy_arn = aws_iam_policy.github_ecr_push.arn
}
