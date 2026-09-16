# Infrastructure Architecture

## Target

AWS.

## Initial runtime

- Docker
- ECS
- Fargate
- RDS PostgreSQL
- ElastiCache Redis
- S3
- KMS
- Secrets Manager / Parameter Store
- CloudWatch

EKS/Kubernetes is deferred until scale, team size or operational requirements justify it.

## Networking

- VPC
- public/private subnet separation
- security groups
- least-privilege IAM

## Environments

- development
- staging
- production

## IaC

Terraform.

## CI/CD

GitHub Actions:

1. install
2. lint
3. type-check
4. unit tests
5. frontend build
6. backend build
7. Docker build
8. dependency/security scan
9. development deployment
10. staging deployment
11. production approval gate

## Reliability

Infrastructure work continues throughout the project:

- backups;
- monitoring;
- scaling;
- observability;
- disaster recovery;
- security;
- cost optimization.
