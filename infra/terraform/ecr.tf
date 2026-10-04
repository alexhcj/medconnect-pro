resource "aws_ecr_repository" "api" {
  name                 = "medconnect-api"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "medconnect-api"
  }
}
