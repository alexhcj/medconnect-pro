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
      "ecr:DescribeImages",
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
  description = "Push and describe medconnect-api images from GitHub Actions on main."
  policy      = data.aws_iam_policy_document.github_ecr_push.json
}

resource "aws_iam_role_policy_attachment" "github_production_ecr" {
  role       = aws_iam_role.github_production.name
  policy_arn = aws_iam_policy.github_ecr_push.arn
}

data "aws_iam_policy_document" "github_ecs_deploy" {
  statement {
    sid    = "EcsClusterRead"
    effect = "Allow"
    actions = [
      "ecs:DescribeClusters",
      "ecs:DescribeServices",
      "ecs:ListServices",
      "ecs:ListTasks",
      "ecs:DescribeTasks",
      "ecs:RunTask",
      "ecs:StopTask",
      "ecs:UpdateService",
    ]
    resources = [
      aws_ecs_cluster.main.arn,
      "arn:aws:ecs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:service/${aws_ecs_cluster.main.name}/${aws_ecs_service.preview_api.name}",
      "arn:aws:ecs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:service/${aws_ecs_cluster.main.name}/${aws_ecs_service.production_api.name}",
      "arn:aws:ecs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:task/${aws_ecs_cluster.main.name}/*",
    ]
  }

  statement {
    sid       = "EcsTaskDefinitions"
    effect    = "Allow"
    actions   = ["ecs:DescribeTaskDefinition", "ecs:ListTaskDefinitions", "ecs:RegisterTaskDefinition"]
    resources = ["*"]
  }

  statement {
    sid    = "EcsRunTaskDefinitions"
    effect = "Allow"
    actions = [
      "ecs:RunTask",
    ]
    resources = [
      "arn:aws:ecs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:task-definition/${aws_ecs_task_definition.preview_api.family}:*",
      "arn:aws:ecs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:task-definition/${aws_ecs_task_definition.production_api.family}:*",
    ]
  }

  statement {
    sid    = "PassApiTaskRoles"
    effect = "Allow"
    actions = [
      "iam:PassRole",
    ]
    resources = [
      aws_iam_role.preview_api_execution.arn,
      aws_iam_role.preview_api_task.arn,
      aws_iam_role.production_api_execution.arn,
      aws_iam_role.production_api_task.arn,
    ]
    condition {
      test     = "StringEquals"
      variable = "iam:PassedToService"
      values   = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_policy" "github_ecs_deploy" {
  name        = "medconnect-github-ecs-deploy"
  description = "Register and roll preview/production API task definitions from GitHub Actions on main (INFRA-011)."
  policy      = data.aws_iam_policy_document.github_ecs_deploy.json
}

resource "aws_iam_role_policy_attachment" "github_production_ecs" {
  role       = aws_iam_role.github_production.name
  policy_arn = aws_iam_policy.github_ecs_deploy.arn
}
