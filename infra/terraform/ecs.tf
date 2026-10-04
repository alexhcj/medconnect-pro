data "aws_iam_policy_document" "ecs_tasks_trust" {
  statement {
    sid     = "EcsTasksAssume"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "preview_api_documents" {
  statement {
    sid    = "PreviewDocumentObjects"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
    ]
    resources = ["${aws_s3_bucket.preview_documents.arn}/practices/*"]
  }
}

data "aws_iam_policy_document" "production_api_documents" {
  statement {
    sid    = "ProductionDocumentObjects"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
    ]
    resources = ["${aws_s3_bucket.production_documents.arn}/practices/*"]
  }
}

resource "aws_iam_role" "preview_api_execution" {
  name               = "medconnect-preview-api-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_trust.json
}

resource "aws_iam_role" "production_api_execution" {
  name               = "medconnect-production-api-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_trust.json
}

resource "aws_iam_role_policy_attachment" "preview_api_execution_ecs" {
  role       = aws_iam_role.preview_api_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy_attachment" "production_api_execution_ecs" {
  role       = aws_iam_role.production_api_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy_attachment" "preview_api_execution_secrets" {
  role       = aws_iam_role.preview_api_execution.name
  policy_arn = aws_iam_policy.preview_secrets_read.arn
}

resource "aws_iam_role_policy_attachment" "production_api_execution_secrets" {
  role       = aws_iam_role.production_api_execution.name
  policy_arn = aws_iam_policy.production_secrets_read.arn
}

resource "aws_iam_role" "preview_api_task" {
  name               = "medconnect-preview-api-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_trust.json
}

resource "aws_iam_role" "production_api_task" {
  name               = "medconnect-production-api-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_trust.json
}

resource "aws_iam_role_policy" "preview_api_documents" {
  name   = "medconnect-preview-api-documents"
  role   = aws_iam_role.preview_api_task.id
  policy = data.aws_iam_policy_document.preview_api_documents.json
}

resource "aws_iam_role_policy" "production_api_documents" {
  name   = "medconnect-production-api-documents"
  role   = aws_iam_role.production_api_task.id
  policy = data.aws_iam_policy_document.production_api_documents.json
}

resource "aws_cloudwatch_log_group" "preview_api" {
  name              = "/ecs/medconnect-preview-api"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "production_api" {
  name              = "/ecs/medconnect-production-api"
  retention_in_days = 14
}

resource "aws_ecs_cluster" "main" {
  name = "medconnect"

  setting {
    name  = "containerInsights"
    value = "disabled"
  }

  tags = {
    Name = "medconnect"
  }
}

locals {
  api_image = "${aws_ecr_repository.api.repository_url}:${var.api_image_tag}"
  api_healthcheck = [
    "CMD-SHELL",
    "node -e \"fetch('http://127.0.0.1:3001/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))\"",
  ]
}

resource "aws_ecs_task_definition" "preview_api" {
  family                   = "medconnect-preview-api"
  cpu                      = "256"
  memory                   = "512"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = aws_iam_role.preview_api_execution.arn
  task_role_arn            = aws_iam_role.preview_api_task.arn

  container_definitions = jsonencode([
    {
      name      = "api"
      image     = local.api_image
      essential = true
      portMappings = [
        {
          containerPort = 3001
          protocol      = "tcp"
        }
      ]
      environment = [
        { name = "APP_ENV", value = "preview" },
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3001" },
        { name = "SWAGGER_UI_ENABLED", value = "false" },
        { name = "WEB_ORIGINS", value = var.preview_web_origins },
        { name = "DOCUMENT_S3_BUCKET", value = aws_s3_bucket.preview_documents.bucket },
      ]
      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "${aws_secretsmanager_secret.preview_api.arn}:DATABASE_URL::"
        },
        {
          name      = "DATABASE_ADMIN_URL"
          valueFrom = "${aws_secretsmanager_secret.preview_api.arn}:DATABASE_ADMIN_URL::"
        },
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.preview_api.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
      healthCheck = {
        command     = local.api_healthcheck
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 40
      }
    }
  ])
}

resource "aws_ecs_task_definition" "production_api" {
  family                   = "medconnect-production-api"
  cpu                      = "256"
  memory                   = "512"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = aws_iam_role.production_api_execution.arn
  task_role_arn            = aws_iam_role.production_api_task.arn

  container_definitions = jsonencode([
    {
      name      = "api"
      image     = local.api_image
      essential = true
      portMappings = [
        {
          containerPort = 3001
          protocol      = "tcp"
        }
      ]
      environment = [
        { name = "APP_ENV", value = "production" },
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3001" },
        { name = "SWAGGER_UI_ENABLED", value = "false" },
        { name = "WEB_ORIGINS", value = var.production_web_origins },
        { name = "DOCUMENT_S3_BUCKET", value = aws_s3_bucket.production_documents.bucket },
      ]
      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "${aws_secretsmanager_secret.production_api.arn}:DATABASE_URL::"
        },
        {
          name      = "DATABASE_ADMIN_URL"
          valueFrom = "${aws_secretsmanager_secret.production_api.arn}:DATABASE_ADMIN_URL::"
        },
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.production_api.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
      healthCheck = {
        command     = local.api_healthcheck
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 40
      }
    }
  ])
}

resource "aws_ecs_service" "preview_api" {
  name            = "preview-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.preview_api.arn
  desired_count   = var.api_desired_count
  launch_type     = "FARGATE"

  health_check_grace_period_seconds = 60

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.preview_api.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.preview_api.arn
    container_name   = "api"
    container_port   = 3001
  }

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  depends_on = [aws_lb_listener.preview_api]
}

resource "aws_ecs_service" "production_api" {
  name            = "production-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.production_api.arn
  desired_count   = var.api_desired_count
  launch_type     = "FARGATE"

  health_check_grace_period_seconds = 60

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.production_api.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.production_api.arn
    container_name   = "api"
    container_port   = 3001
  }

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  depends_on = [aws_lb_listener.production_api]
}
