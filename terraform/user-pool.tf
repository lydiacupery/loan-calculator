resource "aws_cognito_user_pool" "loan_pool" {
  name                     = "tf-loan-user-pool"
  alias_attributes         = ["email"]
  auto_verified_attributes = ["email"]
}

resource "aws_cognito_user_pool_client" "loan_pool_client" {
  name            = "tf-loan-user-pool-client"
  user_pool_id    = aws_cognito_user_pool.loan_pool.id
  generate_secret = "false"
}
