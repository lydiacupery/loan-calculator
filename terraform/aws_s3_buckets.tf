resource "aws_s3_bucket" "lambda-bundles" {
  bucket        = "loan-tf-lydia-lambda-bundles"
  acl           = "private"
  force_destroy = true
  # region = "us-east-2"



  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "aws:kms"
      }
    }
  }

}

resource "aws_s3_bucket" "static-assets" {
  bucket        = "loan-tf-static-assets"
  acl           = "private"
  force_destroy = true

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  website {
    index_document = "index.html"
    error_document = "index.html"
  }

  versioning {
    enabled = true
  }

}
