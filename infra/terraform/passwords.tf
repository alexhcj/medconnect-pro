resource "random_password" "preview_master" {
  length           = 32
  special          = true
  override_special = "-_"
  min_lower        = 1
  min_upper        = 1
  min_numeric      = 1
  min_special      = 1
}

resource "random_password" "preview_app" {
  length           = 32
  special          = true
  override_special = "-_"
  min_lower        = 1
  min_upper        = 1
  min_numeric      = 1
  min_special      = 1
}

resource "random_password" "production_master" {
  length           = 32
  special          = true
  override_special = "-_"
  min_lower        = 1
  min_upper        = 1
  min_numeric      = 1
  min_special      = 1
}

resource "random_password" "production_app" {
  length           = 32
  special          = true
  override_special = "-_"
  min_lower        = 1
  min_upper        = 1
  min_numeric      = 1
  min_special      = 1
}
