terraform {
  required_version = "~> 1.7.3"

  backend "s3" {
    bucket = "198-land-terraform-state"
    key    = "terraform.tfstate"
    region = "eu-north-1"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.33"
    }
    doppler = {
      source  = "DopplerHQ/doppler"
      version = "~> 1.3.0"
    }
  }
}

provider "aws" {
  region = "eu-north-1"
}

variable "DOPPLER_TOKEN_198_LAND_KART" {
  description = "TF Variable for the 198 land kart doppler token"
  type        = string
}

provider "doppler" {
  doppler_token = var.DOPPLER_TOKEN_198_LAND_KART
}