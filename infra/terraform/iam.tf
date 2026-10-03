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
  description = "Read medconnect/preview/api only. Attach to preview GitHub OIDC and later ECS task roles."
  policy      = data.aws_iam_policy_document.preview_secrets_read.json
}

resource "aws_iam_policy" "production_secrets_read" {
  name        = "medconnect-production-secrets-read"
  description = "Read medconnect/production/api only. Attach to production GitHub OIDC and later ECS task roles."
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
