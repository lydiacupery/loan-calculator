resource "aws_iam_policy" "basic-lambda-execution" {
  name        = "loan-tf-${terraform.workspace}-basic-lambda-execution-policy"
  description = "Allows Lambda functions to execute"
  policy      = data.aws_iam_policy_document.basic-lambda-execution.json
}

data "aws_iam_policy_document" "basic-lambda-execution" {
  statement {
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]

    resources = [
      "arn:aws:logs:*:*:*",
    ]
  }
}
