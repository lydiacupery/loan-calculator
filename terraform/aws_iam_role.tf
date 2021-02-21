resource "aws_iam_role" "lambda-execution-role" {
  name               = "loan-tf-${terraform.workspace}-lambda-execution-role"
  assume_role_policy = data.aws_iam_policy_document.lambda-assume-role-policy.json
}

resource "aws_iam_role_policy_attachment" "basic-lambda-execution-policy-attachment" {
  role       = aws_iam_role.lambda-execution-role.name
  policy_arn = aws_iam_policy.basic-lambda-execution.arn
}


