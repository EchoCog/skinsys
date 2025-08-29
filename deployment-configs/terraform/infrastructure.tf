# Terraform Infrastructure Configuration
# Production deployment infrastructure for Cognitive Cities Architecture

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
  }
}

# AWS Provider Configuration
provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-west-2"
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "cognitive-cities-prod"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC for the cluster
resource "aws_vpc" "cognitive_cities" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.cluster_name}-vpc"
    Environment = var.environment
    Project     = "cognitive-cities"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "cognitive_cities" {
  vpc_id = aws_vpc.cognitive_cities.id

  tags = {
    Name        = "${var.cluster_name}-igw"
    Environment = var.environment
  }
}

# Subnets
resource "aws_subnet" "cognitive_cities_public" {
  count = 2

  vpc_id                  = aws_vpc.cognitive_cities.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.cluster_name}-public-${count.index + 1}"
    Environment = var.environment
    Type        = "public"
  }
}

resource "aws_subnet" "cognitive_cities_private" {
  count = 2

  vpc_id            = aws_vpc.cognitive_cities.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "${var.cluster_name}-private-${count.index + 1}"
    Environment = var.environment
    Type        = "private"
  }
}

# Route Tables
resource "aws_route_table" "cognitive_cities_public" {
  vpc_id = aws_vpc.cognitive_cities.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.cognitive_cities.id
  }

  tags = {
    Name        = "${var.cluster_name}-public-rt"
    Environment = var.environment
  }
}

resource "aws_route_table_association" "cognitive_cities_public" {
  count = length(aws_subnet.cognitive_cities_public)

  subnet_id      = aws_subnet.cognitive_cities_public[count.index].id
  route_table_id = aws_route_table.cognitive_cities_public.id
}

# NAT Gateway for private subnets
resource "aws_eip" "cognitive_cities_nat" {
  domain = "vpc"

  tags = {
    Name        = "${var.cluster_name}-nat-eip"
    Environment = var.environment
  }
}

resource "aws_nat_gateway" "cognitive_cities" {
  allocation_id = aws_eip.cognitive_cities_nat.id
  subnet_id     = aws_subnet.cognitive_cities_public[0].id

  tags = {
    Name        = "${var.cluster_name}-nat"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.cognitive_cities]
}

# Private Route Table
resource "aws_route_table" "cognitive_cities_private" {
  vpc_id = aws_vpc.cognitive_cities.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.cognitive_cities.id
  }

  tags = {
    Name        = "${var.cluster_name}-private-rt"
    Environment = var.environment
  }
}

resource "aws_route_table_association" "cognitive_cities_private" {
  count = length(aws_subnet.cognitive_cities_private)

  subnet_id      = aws_subnet.cognitive_cities_private[count.index].id
  route_table_id = aws_route_table.cognitive_cities_private.id
}

# Security Groups
resource "aws_security_group" "cognitive_cities_cluster" {
  name_prefix = "${var.cluster_name}-cluster"
  vpc_id      = aws_vpc.cognitive_cities.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.cluster_name}-cluster-sg"
    Environment = var.environment
  }
}

resource "aws_security_group" "cognitive_cities_nodes" {
  name_prefix = "${var.cluster_name}-nodes"
  vpc_id      = aws_vpc.cognitive_cities.id

  ingress {
    from_port = 0
    to_port   = 65535
    protocol  = "tcp"
    self      = true
  }

  ingress {
    from_port       = 1025
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.cognitive_cities_cluster.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.cluster_name}-nodes-sg"
    Environment = var.environment
  }
}

# Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.cognitive_cities.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.cognitive_cities_public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.cognitive_cities_private[*].id
}