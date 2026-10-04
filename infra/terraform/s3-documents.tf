resource "aws_s3_bucket" "preview_documents" {
  bucket = "medconnect-preview-documents-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name        = "medconnect-preview-documents"
    Environment = "preview"
  }
}

resource "aws_s3_bucket" "production_documents" {
  bucket = "medconnect-production-documents-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name        = "medconnect-production-documents"
    Environment = "production"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "preview_documents" {
  bucket = aws_s3_bucket.preview_documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "production_documents" {
  bucket = aws_s3_bucket.production_documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "preview_documents" {
  bucket = aws_s3_bucket.preview_documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "production_documents" {
  bucket = aws_s3_bucket.production_documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_iam_policy_document" "preview_documents_tls" {
  statement {
    sid     = "DenyInsecureTransport"
    effect  = "Deny"
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.preview_documents.arn,
      "${aws_s3_bucket.preview_documents.arn}/*",
    ]

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

data "aws_iam_policy_document" "production_documents_tls" {
  statement {
    sid     = "DenyInsecureTransport"
    effect  = "Deny"
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.production_documents.arn,
      "${aws_s3_bucket.production_documents.arn}/*",
    ]

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "preview_documents" {
  bucket = aws_s3_bucket.preview_documents.id
  policy = data.aws_iam_policy_document.preview_documents_tls.json
}

resource "aws_s3_bucket_policy" "production_documents" {
  bucket = aws_s3_bucket.production_documents.id
  policy = data.aws_iam_policy_document.production_documents_tls.json
}
