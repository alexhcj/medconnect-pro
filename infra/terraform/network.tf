data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  azs                  = slice(data.aws_availability_zones.available.names, 0, 2)
  public_subnet_cidrs  = [cidrsubnet(var.vpc_cidr, 8, 0), cidrsubnet(var.vpc_cidr, 8, 1)]
  private_subnet_cidrs = [cidrsubnet(var.vpc_cidr, 8, 10), cidrsubnet(var.vpc_cidr, 8, 11)]
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "medconnect"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "medconnect"
  }
}

resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "medconnect-public-${count.index + 1}"
    Tier = "public"
  }
}

resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = {
    Name = "medconnect-private-${count.index + 1}"
    Tier = "private"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "medconnect-public"
  }
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

resource "aws_route_table_association" "public" {
  count = 2

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "medconnect-private"
  }
}

resource "aws_route_table_association" "private" {
  count = 2

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

resource "aws_security_group" "bastion" {
  name        = "medconnect-bastion"
  description = "SSM-only operator hop for hosted migrate/seed. No inbound SSH."
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "medconnect-bastion"
  }
}

resource "aws_security_group" "preview_api" {
  name        = "medconnect-preview-api"
  description = "Placeholder for INFRA-008 preview ECS task ENIs."
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "medconnect-preview-api"
  }
}

resource "aws_security_group" "production_api" {
  name        = "medconnect-production-api"
  description = "Placeholder for INFRA-008 production ECS task ENIs."
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "medconnect-production-api"
  }
}

resource "aws_security_group" "preview_rds" {
  name        = "medconnect-preview-rds"
  description = "Preview/demo PostgreSQL. Ingress from preview API and bastion only."
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "medconnect-preview-rds"
  }
}

resource "aws_security_group" "production_rds" {
  name        = "medconnect-production-rds"
  description = "Production/demo PostgreSQL. Ingress from production API and bastion only."
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "medconnect-production-rds"
  }
}

resource "aws_vpc_security_group_egress_rule" "bastion_https" {
  security_group_id = aws_security_group.bastion.id
  description       = "SSM agent and Session Manager."
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
}

resource "aws_vpc_security_group_egress_rule" "bastion_dns_udp" {
  security_group_id = aws_security_group.bastion.id
  description       = "DNS for SSM and RDS hostname resolution."
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "udp"
  from_port         = 53
  to_port           = 53
}

resource "aws_vpc_security_group_egress_rule" "bastion_dns_tcp" {
  security_group_id = aws_security_group.bastion.id
  description       = "DNS TCP fallback."
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 53
  to_port           = 53
}

resource "aws_vpc_security_group_egress_rule" "bastion_preview_postgres" {
  security_group_id            = aws_security_group.bastion.id
  description                  = "Operator migrate/seed to preview RDS."
  referenced_security_group_id = aws_security_group.preview_rds.id
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
}

resource "aws_vpc_security_group_egress_rule" "bastion_production_postgres" {
  security_group_id            = aws_security_group.bastion.id
  description                  = "Operator migrate/seed to production RDS."
  referenced_security_group_id = aws_security_group.production_rds.id
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
}

resource "aws_vpc_security_group_egress_rule" "preview_api_postgres" {
  security_group_id            = aws_security_group.preview_api.id
  description                  = "Preview API to preview RDS (INFRA-008)."
  referenced_security_group_id = aws_security_group.preview_rds.id
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
}

resource "aws_vpc_security_group_egress_rule" "production_api_postgres" {
  security_group_id            = aws_security_group.production_api.id
  description                  = "Production API to production RDS (INFRA-008)."
  referenced_security_group_id = aws_security_group.production_rds.id
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
}

resource "aws_vpc_security_group_ingress_rule" "preview_rds_from_api" {
  security_group_id            = aws_security_group.preview_rds.id
  description                  = "Preview API tasks."
  referenced_security_group_id = aws_security_group.preview_api.id
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
}

resource "aws_vpc_security_group_ingress_rule" "preview_rds_from_bastion" {
  security_group_id            = aws_security_group.preview_rds.id
  description                  = "Operator SSM tunnel."
  referenced_security_group_id = aws_security_group.bastion.id
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
}

resource "aws_vpc_security_group_ingress_rule" "production_rds_from_api" {
  security_group_id            = aws_security_group.production_rds.id
  description                  = "Production API tasks."
  referenced_security_group_id = aws_security_group.production_api.id
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
}

resource "aws_vpc_security_group_ingress_rule" "production_rds_from_bastion" {
  security_group_id            = aws_security_group.production_rds.id
  description                  = "Operator SSM tunnel."
  referenced_security_group_id = aws_security_group.bastion.id
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
}
