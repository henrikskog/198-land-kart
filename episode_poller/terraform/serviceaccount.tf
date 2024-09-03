resource "aws_iam_user" "cicd_user" {
  name = "198-land-episode-poller-cicd"
}

# Create an IAM policy for updating Lambda function code
resource "aws_iam_policy" "lambda_update_policy" {
  name        = "198-land-episode-poller-update-policy"
  description = "Policy to allow updating Lambda function code"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:UpdateFunctionCode"
        ]
        Resource = aws_lambda_function.lambda.arn
      }
    ]
  })
}

# Attach the policy to the CI/CD user
resource "aws_iam_user_policy_attachment" "cicd_user_policy_attachment" {
  user       = aws_iam_user.cicd_user.name
  policy_arn = aws_iam_policy.lambda_update_policy.arn
}

# Output the user's name for reference
output "cicd_user_name" {
  value       = aws_iam_user.cicd_user.name
  description = "The name of the CI/CD IAM user"
}

resource "aws_iam_access_key" "cicd_user_key" {
  user = aws_iam_user.cicd_user.name
}