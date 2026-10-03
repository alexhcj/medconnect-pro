resource "aws_db_subnet_group" "demo" {
  name       = "medconnect-demo"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "medconnect-demo"
  }
}

resource "aws_db_instance" "preview" {
  identifier     = "medconnect-preview"
  engine         = "postgres"
  engine_version = "18"
  instance_class = "db.t4g.micro"

  db_name  = "medconnect"
  username = "medconnect"
  password = random_password.preview_master.result
  port     = 5432

  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true

  db_subnet_group_name   = aws_db_subnet_group.demo.name
  vpc_security_group_ids = [aws_security_group.preview_rds.id]
  publicly_accessible    = false
  multi_az               = false
  availability_zone      = local.azs[0]

  backup_retention_period = 7
  copy_tags_to_snapshot   = true
  deletion_protection     = false
  skip_final_snapshot     = true

  auto_minor_version_upgrade   = true
  allow_major_version_upgrade  = false
  performance_insights_enabled = false

  tags = {
    Name        = "medconnect-preview"
    Environment = "preview"
  }
}

resource "aws_db_instance" "production" {
  identifier     = "medconnect-production"
  engine         = "postgres"
  engine_version = "18"
  instance_class = "db.t4g.micro"

  db_name  = "medconnect"
  username = "medconnect"
  password = random_password.production_master.result
  port     = 5432

  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true

  db_subnet_group_name   = aws_db_subnet_group.demo.name
  vpc_security_group_ids = [aws_security_group.production_rds.id]
  publicly_accessible    = false
  multi_az               = false
  availability_zone      = local.azs[0]

  backup_retention_period   = 7
  copy_tags_to_snapshot     = true
  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "medconnect-production-final"

  auto_minor_version_upgrade   = true
  allow_major_version_upgrade  = false
  performance_insights_enabled = false

  tags = {
    Name        = "medconnect-production"
    Environment = "production"
  }
}

locals {
  preview_database_url = format(
    "postgresql://medconnect_app:%s@%s:5432/medconnect?sslmode=require",
    urlencode(random_password.preview_app.result),
    aws_db_instance.preview.address,
  )
  preview_database_admin_url = format(
    "postgresql://medconnect:%s@%s:5432/medconnect?sslmode=require",
    urlencode(random_password.preview_master.result),
    aws_db_instance.preview.address,
  )
  production_database_url = format(
    "postgresql://medconnect_app:%s@%s:5432/medconnect?sslmode=require",
    urlencode(random_password.production_app.result),
    aws_db_instance.production.address,
  )
  production_database_admin_url = format(
    "postgresql://medconnect:%s@%s:5432/medconnect?sslmode=require",
    urlencode(random_password.production_master.result),
    aws_db_instance.production.address,
  )
}
